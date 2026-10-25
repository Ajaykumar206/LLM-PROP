"""
LLM-Prop: Crystal Structure CIF Downloader
Downloads or audits CIF structures from Materials Project into data/structures_cif/.
"""

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import pandas as pd
from src.utils.config import settings
from src.utils.logging_config import logger

def download_or_audit_structures(limit: int = 50):
    print("=" * 65)
    print("LLM-Prop: Crystal Structure CIF Audit & Downloader")
    print("=" * 65)

    cif_dir = settings.STRUCTURES_CIF_DIR
    cif_dir.mkdir(parents=True, exist_ok=True)
    cif_files = list(cif_dir.glob("*.cif"))
    print(f"Current CIF files in {cif_dir}: {len(cif_files)}")

    if len(cif_files) > 0:
        print(f"[FOUND] Already present {len(cif_files)} CIF structure files.")
        sample_cifs = [f.name for f in cif_files[:5]]
        print(f"Sample CIF structures: {sample_cifs}")
        return

    mp_key = settings.MP_API_KEY or os.environ.get("MP_API_KEY")
    if not mp_key:
        print("[NOTICE] MP_API_KEY not provided. Place CIF files in data/structures_cif/ directly.")
        return

    try:
        from mp_api.client import MPRester
        raw_csv = settings.RAW_DATA_PATH
        if not raw_csv.exists():
            print(f"[ERROR] Raw materials file not found at {raw_csv}")
            return

        df = pd.read_csv(raw_csv)
        material_ids = df["material_id"].dropna().tolist()[:limit]
        print(f"Fetching {len(material_ids)} CIF structures from Materials Project...")

        with MPRester(mp_key) as mpr:
            for mid in material_ids:
                try:
                    cif_path = cif_dir / f"{mid}.cif"
                    if cif_path.exists():
                        continue
                    structure = mpr.get_structure_by_material_id(mid)
                    cif_str = structure.to(fmt="cif")
                    with open(cif_path, "w", encoding="utf-8") as f:
                        f.write(cif_str)
                    print(f"Saved: {mid}.cif")
                except Exception as ex:
                    print(f"Failed {mid}: {ex}")
    except Exception as e:
        print(f"[ERROR] Could not download structures: {e}")

if __name__ == "__main__":
    download_or_audit_structures()
