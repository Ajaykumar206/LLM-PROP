"""
LLM-Prop: Dataset Download & Ingestion Script
Fetches crystalline materials from Materials Project API or verifies local raw datasets.
"""

import os
import sys
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import pandas as pd
from src.utils.config import settings
from src.utils.logging_config import logger

def download_or_verify_dataset(target_count: int = 10000):
    print("=" * 65)
    print("LLM-Prop: Materials Project Dataset Downloader")
    print("=" * 65)

    raw_path = settings.RAW_DATA_PATH
    if raw_path.exists():
        df = pd.read_csv(raw_path)
        print(f"[FOUND] Existing raw dataset found at: {raw_path}")
        print(f"Total Materials in raw dataset: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        return

    mp_key = settings.MP_API_KEY or os.environ.get("MP_API_KEY")
    if not mp_key:
        print("[WARNING] MP_API_KEY not configured in .env. Cannot download new data from API.")
        print(f"Please set MP_API_KEY in .env or place {raw_path.name} in data/raw/")
        return

    try:
        from mp_api.client import MPRester
        print(f"Connecting to Materials Project API using MPRester...")
        with MPRester(mp_key) as mpr:
            docs = mpr.materials.summary.search(
                fields=["material_id", "formula_pretty", "symmetry", "band_gap", "formation_energy_per_atom", "density"],
                num_chunks=target_count // 1000
            )
            records = []
            for d in docs:
                records.append({
                    "material_id": d.material_id,
                    "formula": d.formula_pretty,
                    "crystal_system": d.symmetry.crystal_system.value if hasattr(d.symmetry, "crystal_system") else "unknown",
                    "space_group": d.symmetry.symbol if hasattr(d.symmetry, "symbol") else "unknown",
                    "band_gap_eV": getattr(d, "band_gap", 0.0),
                    "formation_energy_eV_atom": getattr(d, "formation_energy_per_atom", 0.0),
                    "density_g_cm3": getattr(d, "density", 0.0)
                })
            df = pd.DataFrame(records)
            raw_path.parent.mkdir(parents=True, exist_ok=True)
            df.to_csv(raw_path, index=False)
            print(f"[SUCCESS] Downloaded {len(df)} materials and saved to {raw_path}")
    except Exception as e:
        print(f"[ERROR] Failed to query Materials Project: {e}")

if __name__ == "__main__":
    download_or_verify_dataset()
