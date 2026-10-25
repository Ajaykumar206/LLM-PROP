"""
LLM-Prop: T5 Sequence-to-Sequence Model Training Script
Trains T5 on crystalline material properties with regularization & early stopping.
"""

import sys
import random
import numpy as np
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from src.utils.config import settings
from src.utils.logging_config import logger
from src.models.t5_model import T5MaterialModel
from src.models.t5_dataset import MaterialSeq2SeqDataset
from src.models.t5_trainer import T5Trainer

def build_seq2seq_samples(df: pd.DataFrame) -> list:
    samples = []
    for _, row in df.iterrows():
        formula = str(row.get("formula", "")).strip()
        cs = str(row.get("crystal_system", "Unknown")).strip()
        spg = str(row.get("space_group", "Unknown")).strip()
        bg = float(row.get("band_gap_eV", 0.0))
        fe = float(row.get("formation_energy_eV_atom", 0.0))
        dens = float(row.get("density_g_cm3", 1.0))

        # Joint prediction task
        samples.append({
            "task_type": "all_properties",
            "input_text": f"predict properties: formula: {formula} | crystal_system: {cs} | spacegroup: {spg}",
            "target_text": f"band_gap: {bg:.2f} eV | formation_energy: {fe:.2f} eV/atom | density: {dens:.2f} g/cm^3"
        })

        # Single property tasks
        samples.append({
            "task_type": "band_gap",
            "input_text": f"predict band gap: formula: {formula} | system: {cs}",
            "target_text": f"{bg:.2f} eV"
        })
        samples.append({
            "task_type": "formation_energy",
            "input_text": f"predict formation energy: formula: {formula} | system: {cs}",
            "target_text": f"{fe:.2f} eV/atom"
        })
    return samples

def main(epochs: int = 3, batch_size: int = 16, sample_limit: int = 2000):
    print("=" * 65)
    print("LLM-Prop: Training Fine-Tuned T5 Materials Prediction Model")
    print("=" * 65)

    data_file = settings.SPLITS_DIR / "train.csv"
    if not data_file.exists():
        data_file = settings.PROCESSED_DATA_PATH

    if not data_file.exists():
        print(f"[ERROR] Training dataset not found at {data_file}")
        return

    df = pd.read_csv(data_file)
    if len(df) > sample_limit:
        df = df.sample(n=sample_limit, random_state=42).reset_index(drop=True)

    print(f"Loaded {len(df)} materials for training.")
    samples = build_seq2seq_samples(df)
    random.shuffle(samples)

    split_idx = int(len(samples) * 0.85)
    train_samples = samples[:split_idx]
    val_samples = samples[split_idx:]

    model_name = "t5-small"
    print(f"Initializing tokenizer and model ({model_name})...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = T5MaterialModel(model_name_or_path=model_name, dropout_rate=0.1)

    train_dataset = MaterialSeq2SeqDataset(train_samples, tokenizer)
    val_dataset = MaterialSeq2SeqDataset(val_samples, tokenizer)

    trainer = T5Trainer(
        model=model,
        tokenizer=tokenizer,
        learning_rate=3e-4,
        weight_decay=0.01,
        early_stopping_patience=2
    )

    print(f"Beginning training for {epochs} epochs...")
    result = trainer.train(
        train_dataset=train_dataset,
        val_dataset=val_dataset,
        epochs=epochs,
        batch_size=batch_size,
        output_dir=settings.T5_MODEL_DIR
    )

    print(f"[SUCCESS] T5 training completed. Best Val Loss: {result['best_val_loss']}")
    print(f"Checkpoints and tokenizer saved to: {settings.T5_MODEL_DIR}")

if __name__ == "__main__":
    main()
