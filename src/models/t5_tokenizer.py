from typing import Optional, Dict, Any, List
from pathlib import Path
from transformers import AutoTokenizer
from src.utils.logging_config import logger

class T5MaterialTokenizer:
    """
    Tokenizer wrapper for formatting prompts and tokenizing material sequence inputs.
    """
    def __init__(self, model_name_or_path: str = "t5-small"):
        self.model_name_or_path = model_name_or_path
        self.tokenizer = AutoTokenizer.from_pretrained(str(model_name_or_path))

    @staticmethod
    def format_property_prompt(formula: str, crystal_system: Optional[str] = None, space_group: Optional[str] = None) -> str:
        cs = crystal_system or "Unknown"
        spg = space_group or "Unknown"
        return f"predict properties: formula: {formula} | crystal_system: {cs} | spacegroup: {spg}"

    @staticmethod
    def format_single_property_prompt(property_name: str, formula: str, crystal_system: Optional[str] = None) -> str:
        cs = crystal_system or "Unknown"
        return f"predict {property_name}: formula: {formula} | system: {cs}"

    @staticmethod
    def format_description_prompt(formula: str, crystal_system: Optional[str] = None) -> str:
        cs = crystal_system or "crystalline"
        return f"describe material: formula: {formula} | system: {cs}"

    def tokenize(self, text: str, max_length: int = 64, truncation: bool = True):
        return self.tokenizer(text, max_length=max_length, truncation=truncation, return_tensors="pt")

    def decode(self, token_ids, skip_special_tokens: bool = True) -> str:
        return self.tokenizer.decode(token_ids, skip_special_tokens=skip_special_tokens)

    def save_pretrained(self, save_directory: Path):
        save_directory = Path(save_directory)
        save_directory.mkdir(parents=True, exist_ok=True)
        self.tokenizer.save_pretrained(str(save_directory))
        logger.info(f"Tokenizer saved to {save_directory}")
