import sys
import os
import random
from pathlib import Path

# Ensure repository root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import numpy as np
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from sklearn.model_selection import train_test_split

from backend.utils.config import settings
from backend.utils.logging_config import logger
from training.dataset import prepare_seq2seq_samples, MaterialSeq2SeqDataset
from training.trainer import T5ModelTrainer
from training.evaluate import evaluate_t5_model

def create_stratified_splits(df: pd.DataFrame) -> tuple:
    """
    Creates stratified splits across electronic type (Metal vs Non-Metal) and stability.
    """
    settings.SPLITS_DIR.mkdir(parents=True, exist_ok=True)
    train_path = settings.SPLITS_DIR / "train.csv"
    val_path = settings.SPLITS_DIR / "val.csv"
    test_path = settings.SPLITS_DIR / "test.csv"

    if train_path.exists() and val_path.exists() and test_path.exists():
        logger.info(f"Loading existing splits from {settings.SPLITS_DIR}")
        return pd.read_csv(train_path), pd.read_csv(val_path), pd.read_csv(test_path)

    logger.info("Creating fresh stratified train/val/test splits...")
    strat_key = (df["band_gap_eV"] == 0.0).astype(str) + "_" + df["is_stable"].astype(str)

    train_df, temp_df = train_test_split(df, test_size=0.20, random_state=42, stratify=strat_key)
    strat_temp = (temp_df["band_gap_eV"] == 0.0).astype(str) + "_" + temp_df["is_stable"].astype(str)
    val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=42, stratify=strat_temp)

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)
    logger.info(f"Splits saved: {len(train_df)} train, {len(val_df)} val, {len(test_df)} test.")

    return train_df, val_df, test_df

def run_training(
    epochs: int = 2,
    batch_size: int = 16,
    train_sample_limit: int = 800,
    val_sample_limit: int = 150,
    base_model: str = None,
    from_scratch: bool = False
):
    print("=" * 70)
    print("LLM-Prop: Training T5 Seq2Seq Materials Predictor (Regularized)")
    print("=" * 70)

    # 1. Load data
    data_path = settings.PROCESSED_DATA_PATH
    if not data_path.exists():
        data_path = settings.RAW_DATA_PATH

    if not data_path.exists():
        print(f"[ERROR] Source dataset not found at {data_path}")
        return

    full_df = pd.read_csv(data_path)
    train_df, val_df, test_df = create_stratified_splits(full_df)

    # Stratified sub-sampling for CPU efficiency while preserving class distribution
    if len(train_df) > train_sample_limit:
        metals = train_df[train_df["band_gap_eV"] == 0.0]
        non_metals = train_df[train_df["band_gap_eV"] > 0.0]
        n_metals = min(len(metals), int(train_sample_limit * 0.35))
        n_non_metals = train_sample_limit - n_metals
        train_df = pd.concat([
            metals.sample(n=n_metals, random_state=42),
            non_metals.sample(n=n_non_metals, random_state=42)
        ]).sample(frac=1.0, random_state=42).reset_index(drop=True)

    if len(val_df) > val_sample_limit:
        val_df = val_df.sample(n=val_sample_limit, random_state=42).reset_index(drop=True)

    print(f"Prepared {len(train_df)} training and {len(val_df)} validation materials.")

    # 2. Build multi-task seq2seq samples
    train_samples = prepare_seq2seq_samples(train_df)
    val_samples = prepare_seq2seq_samples(val_df)
    random.shuffle(train_samples)
    random.shuffle(val_samples)

    # 3. Initialize tokenizer and model (prefer local checkpoint to avoid 242MB download hangs)
    local_checkpoint = settings.T5_MODEL_DIR
    has_local_weights = (local_checkpoint / "model.safetensors").exists()

    if not from_scratch and has_local_weights and (base_model is None or base_model == str(local_checkpoint)):
        model_source = str(local_checkpoint)
        print(f"Loading local base model from checkpoint: '{model_source}' (offline)...")
    else:
        model_source = base_model or "t5-small"
        print(f"Loading pretrained base model: '{model_source}' (downloading from Hugging Face if not cached, ~242MB)...")

    tokenizer = AutoTokenizer.from_pretrained(model_source)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_source)

    # Set dropout to 0.1 for regularization against overfitting
    if hasattr(model.config, "dropout_rate"):
        model.config.dropout_rate = 0.1

    # 4. Construct Datasets
    train_dataset = MaterialSeq2SeqDataset(train_samples, tokenizer, max_input_len=64, max_target_len=56)
    val_dataset = MaterialSeq2SeqDataset(val_samples, tokenizer, max_input_len=64, max_target_len=56)

    # 5. Trainer with early stopping & weight decay
    trainer = T5ModelTrainer(
        model=model,
        tokenizer=tokenizer,
        learning_rate=3e-4,
        weight_decay=0.01,
        early_stopping_patience=2
    )

    print(f"Training for {epochs} epochs (batch size: {batch_size})...")
    train_result = trainer.train(
        train_dataset=train_dataset,
        val_dataset=val_dataset,
        epochs=epochs,
        batch_size=batch_size,
        output_dir=settings.T5_MODEL_DIR
    )

    print(f"[SUCCESS] T5 training complete! Best Val Loss: {train_result['best_val_loss']}")
    print(f"Model saved to: {settings.T5_MODEL_DIR}")

    # 6. Run full evaluation computing Accuracy, F1, Confusion Matrix, and ROC Curve
    print("\nRunning post-training evaluation on held-out test split...")
    eval_results = evaluate_t5_model(test_sample_limit=150)
    return {
        "train": train_result,
        "evaluation": eval_results
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train fine-tuned T5 model on materials properties")
    parser.add_argument("--epochs", type=int, default=2, help="Number of epochs to train (default: 2)")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument("--train-samples", type=int, default=800, help="Train sample limit (default: 800)")
    parser.add_argument("--val-samples", type=int, default=150, help="Validation sample limit (default: 150)")
    parser.add_argument("--from-scratch", action="store_true", help="Download raw t5-small from HuggingFace instead of loading local checkpoint")
    parser.add_argument("--base-model", type=str, default=None, help="Base model name or path (default: local checkpoint or t5-small)")
    args = parser.parse_args()

    run_training(
        epochs=args.epochs,
        batch_size=args.batch_size,
        train_sample_limit=args.train_samples,
        val_sample_limit=args.val_samples,
        base_model=args.base_model,
        from_scratch=args.from_scratch
    )


