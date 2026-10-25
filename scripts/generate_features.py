"""
LLM-Prop: Feature Engineering Pipeline
Extracts compositional and structural features from chemical formulas and crystal parameters.
"""

import re
import sys
from pathlib import Path
from typing import Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import numpy as np
import pandas as pd
from src.utils.config import settings
from src.utils.logging_config import logger

# Approximate standard atomic weights for common elements
ATOMIC_WEIGHTS = {
    "H": 1.008, "He": 4.0026, "Li": 6.94, "Be": 9.0122, "B": 10.81, "C": 12.011,
    "N": 14.007, "O": 15.999, "F": 18.998, "Ne": 20.180, "Na": 22.990, "Mg": 24.305,
    "Al": 26.982, "Si": 28.085, "P": 30.974, "S": 32.06, "Cl": 35.45, "Ar": 39.948,
    "K": 39.098, "Ca": 40.078, "Sc": 44.956, "Ti": 47.867, "V": 50.942, "Cr": 51.996,
    "Mn": 54.938, "Fe": 55.845, "Co": 58.933, "Ni": 58.693, "Cu": 63.546, "Zn": 65.38,
    "Ga": 69.723, "Ge": 72.630, "As": 74.922, "Se": 78.971, "Br": 79.904, "Kr": 83.798,
    "Rb": 85.468, "Sr": 87.62, "Y": 88.906, "Zr": 91.224, "Nb": 92.906, "Mo": 95.95,
    "Ru": 101.07, "Rh": 102.91, "Pd": 106.42, "Ag": 107.87, "Cd": 112.41, "In": 114.82,
    "Sn": 118.71, "Sb": 121.76, "Te": 127.60, "I": 126.90, "Cs": 132.91, "Ba": 137.33,
    "La": 138.91, "Ce": 140.12, "Pr": 140.91, "Nd": 144.24, "Sm": 150.36, "Eu": 151.96,
    "Gd": 157.25, "Tb": 158.93, "Dy": 162.50, "Ho": 164.93, "Er": 167.26, "Tm": 168.93,
    "Yb": 173.05, "Lu": 174.97, "Hf": 178.49, "Ta": 180.95, "W": 183.84, "Re": 186.21,
    "Os": 190.23, "Ir": 192.22, "Pt": 195.08, "Au": 196.97, "Hg": 200.59, "Tl": 204.38,
    "Pb": 207.2, "Bi": 208.98, "Th": 232.04, "U": 238.03
}

def parse_formula_composition(formula: str) -> Dict[str, float]:
    """Parses chemical formula into element counts."""
    pattern = r"([A-Z][a-z]*)(\d*(?:\.\d+)?)"
    matches = re.findall(pattern, formula)
    composition = {}
    for elem, count_str in matches:
        if not elem:
            continue
        count = float(count_str) if count_str else 1.0
        composition[elem] = composition.get(elem, 0.0) + count
    return composition

def compute_formula_features(formula: str) -> Dict[str, float]:
    """Computes formula weight, number of elements, and average atomic weight."""
    comp = parse_formula_composition(formula)
    if not comp:
        return {"num_elements": 0, "total_atoms": 0, "formula_weight": 0.0, "avg_atomic_weight": 0.0}

    total_atoms = sum(comp.values())
    weight = sum(comp[el] * ATOMIC_WEIGHTS.get(el, 50.0) for el in comp)
    avg_weight = weight / max(1.0, total_atoms)

    return {
        "num_elements": len(comp),
        "total_atoms": total_atoms,
        "formula_weight": round(weight, 3),
        "avg_atomic_weight": round(avg_weight, 3)
    }

def generate_features_for_dataset():
    print("=" * 65)
    print("LLM-Prop: Chemical Feature Generation")
    print("=" * 65)

    data_path = settings.PROCESSED_DATA_PATH
    if not data_path.exists():
        print(f"[ERROR] Processed data not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    print(f"Generating features for {len(df)} materials...")

    feature_rows = []
    for formula in df["formula"]:
        feature_rows.append(compute_formula_features(str(formula)))

    features_df = pd.DataFrame(feature_rows)
    combined = pd.concat([df.reset_index(drop=True), features_df.reset_index(drop=True)], axis=1)

    out_file = settings.DATA_DIR / "processed" / "materials_with_features.csv"
    combined.to_csv(out_file, index=False)
    print(f"[SUCCESS] Features saved to: {out_file}")
    print(f"Features added: {list(features_df.columns)}")

if __name__ == "__main__":
    generate_features_for_dataset()
