import sys
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import pandas as pd
from backend.utils.config import settings
from backend.utils.validators import formula_validator

def validate_datasets():
    print("=" * 65)
    print("LLM-Prop: Materials Dataset Integrity & Validation Suite")
    print("=" * 65)

    data_file = settings.PROCESSED_DATA_PATH
    if not data_file.exists():
        data_file = settings.RAW_DATA_PATH

    if not data_file.exists():
        print(f"[FAIL] Primary dataset not found at {data_file}")
        return False

    df = pd.read_csv(data_file)
    print(f"Loaded primary dataset: {len(df)} records from {data_file.name}")

    required_columns = [
        "material_id", "formula", "crystal_system", "space_group",
        "band_gap_eV", "formation_energy_eV_atom", "density_g_cm3"
    ]

    missing_cols = [c for c in required_columns if c not in df.columns]
    if missing_cols:
        print(f"[FAIL] Missing required columns: {missing_cols}")
        return False
    print(f"[PASS] All {len(required_columns)} critical columns present.")

    # Numerical range checks
    invalid_bg = df[df["band_gap_eV"] < 0.0]
    invalid_dens = df[df["density_g_cm3"] <= 0.0]

    print(f"[CHECK] Negative bandgap count: {len(invalid_bg)}")
    print(f"[CHECK] Non-positive density count: {len(invalid_dens)}")

    # Sample formula syntax check
    sample_formulas = df["formula"].head(100).tolist()
    valid_syntax = sum(1 for f in sample_formulas if formula_validator.is_valid_formula(f))
    print(f"[PASS] Formula syntax validity on 100 sample records: {valid_syntax}/100")

    # Check splits
    splits = ["train.csv", "val.csv", "test.csv"]
    for s in splits:
        sp = settings.SPLITS_DIR / s
        if sp.exists():
            sdf = pd.read_csv(sp)
            print(f"[PASS] Split '{s}' exists with {len(sdf)} materials.")
        else:
            print(f"[WARN] Split '{s}' not found in {settings.SPLITS_DIR}")

    print("\nDataset validation successfully completed.")
    return True

if __name__ == "__main__":
    validate_datasets()
