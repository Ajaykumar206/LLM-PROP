import torch
from torch.utils.data import Dataset
from typing import List, Dict, Any, Optional

class MaterialSeq2SeqDataset(Dataset):
    """
    PyTorch Dataset for multi-task material property sequence-to-sequence learning.
    """
    def __init__(
        self,
        samples: List[Dict[str, Any]],
        tokenizer,
        max_input_len: int = 64,
        max_target_len: int = 48
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
            "task_type": item.get("task_type", "all")
        }
