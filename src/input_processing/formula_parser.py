import re
from typing import Dict, Any, List, Optional

class FormulaParser:
    """
    Parses chemical formulas, validates composition, and extracts stoichiometry.
    """
    ELEMENT_PATTERN = re.compile(r"([A-Z][a-z]*)(\d*(?:\.\d+)?)")

    @classmethod
    def parse(cls, formula: str) -> Dict[str, float]:
        """
        Parses a chemical formula like 'Fe2O3' or 'SrTiO3' into {'Fe': 2.0, 'O': 3.0}.
        """
        if not formula or not isinstance(formula, str):
            raise ValueError("Formula must be a non-empty string.")

        formula = formula.strip()
        # Remove parentheses if simple
        matches = cls.ELEMENT_PATTERN.findall(formula)
        if not matches:
            raise ValueError(f"Invalid chemical formula: '{formula}'")

        composition: Dict[str, float] = {}
        for elem, count_str in matches:
            count = float(count_str) if count_str else 1.0
            composition[elem] = composition.get(elem, 0.0) + count

        return composition

    @classmethod
    def get_element_list(cls, formula: str) -> List[str]:
        return list(cls.parse(formula).keys())

    @classmethod
    def get_total_atoms(cls, formula: str) -> float:
        return sum(cls.parse(formula).values())

    @classmethod
    def is_valid_formula(cls, formula: str) -> bool:
        try:
            cls.parse(formula)
            return True
        except Exception:
            return False

formula_parser = FormulaParser()
