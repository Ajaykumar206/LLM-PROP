import torch
from torch.utils.data import Dataset
from typing import List, Dict, Any, Optional
import pandas as pd

class MaterialSeq2SeqDataset(Dataset):
    """
    PyTorch Dataset for T5 multi-task sequence-to-sequence learning on crystalline materials.
    Includes both continuous property regression and categorical classification tasks.
    """
    def __init__(
        self,
        samples: List[Dict[str, Any]],
        tokenizer,
        max_input_len: int = 64,
        max_target_len: int = 56
    ):
        self.samples = samples
        self.tokenizer = tokenizer
        self.max_input_len = max_input_len
        self.max_target_len = max_target_len

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.samples[idx]
        in_enc = self.tokenizer(
            item["input_text"],
            max_length=self.max_input_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        out_enc = self.tokenizer(
            item["target_text"],
            max_length=self.max_target_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        labels = out_enc["input_ids"].squeeze(0)
        labels[labels == self.tokenizer.pad_token_id] = -100

        return {
            "input_ids": in_enc["input_ids"].squeeze(0),
            "attention_mask": in_enc["attention_mask"].squeeze(0),
            "labels": labels,
            "target_text": item["target_text"],
            "task_type": item.get("task_type", "all"),
            "is_metal": item.get("is_metal", 0),
            "is_stable": item.get("is_stable", 0)
        }

def prepare_seq2seq_samples(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Constructs multi-task samples from materials DataFrame:
    1. Joint property regression + classification
    2. Electronic type classification (Metal vs Non-Metal)
    3. Thermodynamic stability classification (Stable vs Unstable)
    """
    samples = []
    for _, row in df.iterrows():
        formula = str(row.get("formula", "")).strip()
        cs = str(row.get("crystal_system", "Unknown")).strip()
        spg = str(row.get("space_group", "Unknown")).strip()

        bg = float(row.get("band_gap_eV", 0.0) or 0.0)
        fe = float(row.get("formation_energy_eV_atom", 0.0) or 0.0)
        dens = float(row.get("density_g_cm3", 1.0) or 1.0)
        is_stab = bool(row.get("is_stable", False))

        is_metal = 1 if bg == 0.0 else 0
        elec_type = "Metal" if is_metal else "Non-Metal"
        stab_str = "Stable" if is_stab else "Unstable"

        # Multi-task sequence with regression targets and classification labels
        samples.append({
            "task_type": "all_properties",
            "input_text": f"predict properties: formula: {formula} | crystal_system: {cs} | spacegroup: {spg}",
            "target_text": f"band_gap: {bg:.2f} eV | formation_energy: {fe:.2f} eV/atom | density: {dens:.2f} g/cm^3 | type: {elec_type} | stability: {stab_str}",
            "is_metal": is_metal,
            "is_stable": 1 if is_stab else 0,
            "band_gap": bg,
            "formation_energy": fe,
            "density": dens,
            "formula": formula,
            "crystal_system": cs,
            "space_group": spg
        })

        # Dedicated electronic classification task
        samples.append({
            "task_type": "classify_electronic",
            "input_text": f"classify electronic type: formula: {formula} | system: {cs}",
            "target_text": f"{elec_type}",
            "is_metal": is_metal,
            "is_stable": 1 if is_stab else 0,
            "band_gap": bg,
            "formula": formula
        })

    return samples
