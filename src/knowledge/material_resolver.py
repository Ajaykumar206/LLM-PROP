import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from src.utils.config import settings
from src.utils.logging_config import logger

class MaterialResolver:
    """
    Resolves material identifiers (mp-id, formula, name) against local dataset.
    """
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self._load_cache()

    def _load_cache(self):
        csv_path = settings.PROCESSED_DATA_PATH
        if not csv_path.exists():
            csv_path = settings.RAW_DATA_PATH

        if csv_path.exists():
            try:
                self.df = pd.read_csv(csv_path)
                logger.info(f"Loaded {len(self.df)} materials into MaterialResolver cache.")
            except Exception as e:
                logger.warning(f"Failed to load dataset into MaterialResolver: {e}")

    def find_by_formula(self, formula: str) -> List[Dict[str, Any]]:
        if self.df is None or self.df.empty:
            return []
        query = formula.strip().lower()
        matched = self.df[self.df["formula"].astype(str).str.lower() == query]
        return matched.to_dict(orient="records")

    def find_by_material_id(self, material_id: str) -> Optional[Dict[str, Any]]:
        if self.df is None or self.df.empty:
            return None
        mid = material_id.strip().lower()
        matched = self.df[self.df["material_id"].astype(str).str.lower() == mid]
        if not matched.empty:
            return matched.iloc[0].to_dict()
        return None

    def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        if self.df is None or self.df.empty:
            return []
        q = query.strip().lower()
        matched = self.df[
            self.df["formula"].astype(str).str.lower().str.contains(q, regex=False) |
            self.df["material_id"].astype(str).str.lower().str.contains(q, regex=False)
        ]
        return matched.head(limit).to_dict(orient="records")

material_resolver = MaterialResolver()
