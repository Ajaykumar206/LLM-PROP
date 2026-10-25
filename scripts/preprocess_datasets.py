"""
LLM-Prop: Dataset Preprocessing Pipeline
Cleans, normalizes, validates, and partitions raw materials data into train/val/test splits.
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from src.utils.config import settings
from src.utils.logging_config import logger

def preprocess_datasets(test_size: float = 0.1, val_size: float = 0.1, random_state: int = 42):
    print("=" * 65)
    print("LLM-Prop: Preprocessing Materials Datasets")
    print("=" * 65)

    input_path = settings.RAW_DATA_PATH
    if not input_path.exists():
        # Fallback to processed if raw not present
        input_path = settings.PROCESSED_DATA_PATH

    if not input_path.exists():
        print(f"[ERROR] No raw or processed data found at {input_path}")
        return

    df = pd.read_csv(input_path)
    print(f"Loaded {len(df)} initial materials from {input_path.name}")

    # Standardize column names
    col_mapping = {
        "formula_pretty": "formula",
        "band_gap": "band_gap_eV",
        "formation_energy_per_atom": "formation_energy_eV_atom",
        "density": "density_g_cm3"
    }
    df = df.rename(columns={k: v for k, v in col_mapping.items() if k in df.columns})

    # Cleaning: drop nulls
    required_cols = ["material_id", "formula", "crystal_system", "band_gap_eV", "formation_energy_eV_atom", "density_g_cm3"]
    existing_required = [c for c in required_cols if c in df.columns]
    df = df.dropna(subset=existing_required).drop_duplicates(subset=["material_id"])

    # Physical validity checks
    df = df[df["density_g_cm3"] > 0]
    df = df[df["band_gap_eV"] >= 0]

    # Normalize string columns
    df["formula"] = df["formula"].astype(str).str.strip()
    df["crystal_system"] = df["crystal_system"].astype(str).str.strip().str.capitalize()
    if "space_group" in df.columns:
        df["space_group"] = df["space_group"].astype(str).str.strip()

    # Save processed master dataset
    processed_out = settings.DATA_DIR / "processed" / "materials_processed.csv"
    processed_out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(processed_out, index=False)
    print(f"Saved cleaned dataset to: {processed_out} ({len(df)} records)")

    # Create train / validation / test splits
    splits_dir = settings.SPLITS_DIR
    splits_dir.mkdir(parents=True, exist_ok=True)

    train_df, test_df = train_test_split(df, test_size=test_size, random_state=random_state)
    val_ratio_adjusted = val_size / (1.0 - test_size)
    train_df, val_df = train_test_split(train_df, test_size=val_ratio_adjusted, random_state=random_state)

    train_df.to_csv(splits_dir / "train.csv", index=False)
    val_df.to_csv(splits_dir / "val.csv", index=False)
    test_df.to_csv(splits_dir / "test.csv", index=False)

    print(f"[SUCCESS] Dataset splits generated in {splits_dir}:")
    print(f"  * Train: {len(train_df)} samples")
    print(f"  * Validation: {len(val_df)} samples")
    print(f"  * Test: {len(test_df)} samples")

if __name__ == "__main__":
    preprocess_datasets()
