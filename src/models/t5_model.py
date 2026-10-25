import torch
import torch.nn as nn
from typing import Optional, Dict, Any
from pathlib import Path
from transformers import AutoModelForSeq2SeqLM, T5ForConditionalGeneration
from src.utils.logging_config import logger

class T5MaterialModel(nn.Module):
    """
    T5 Seq2Seq model wrapper for material property prediction and natural language description.
    """
    def __init__(self, model_name_or_path: str = "t5-small", dropout_rate: float = 0.1):
        super().__init__()
        self.model_name_or_path = model_name_or_path
        self.dropout_rate = dropout_rate
        self.model: Optional[T5ForConditionalGeneration] = None
        self._initialize_model()

    def _initialize_model(self):
        logger.info(f"Loading T5 model architecture from: {self.model_name_or_path}")
        self.model = AutoModelForSeq2SeqLM.from_pretrained(str(self.model_name_or_path))
        if hasattr(self.model.config, "dropout_rate"):
            self.model.config.dropout_rate = self.dropout_rate

    def forward(self, input_ids, attention_mask=None, labels=None, **kwargs):
        return self.model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels,
            **kwargs
        )

    def generate(self, *args, **kwargs):
        return self.model.generate(*args, **kwargs)

    def save_pretrained(self, save_directory: Path):
        save_directory = Path(save_directory)
        save_directory.mkdir(parents=True, exist_ok=True)
        self.model.save_pretrained(str(save_directory))
        logger.info(f"Model saved to {save_directory}")

    @classmethod
    def from_pretrained(cls, load_directory: Path, **kwargs):
        instance = cls.__new__(cls)
        super(T5MaterialModel, instance).__init__()
        instance.model_name_or_path = str(load_directory)
        instance.dropout_rate = kwargs.get("dropout_rate", 0.1)
        instance.model = AutoModelForSeq2SeqLM.from_pretrained(str(load_directory), **kwargs)
        return instance
