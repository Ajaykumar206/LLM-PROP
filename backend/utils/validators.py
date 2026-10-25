import re
from typing import Dict, Optional, Tuple, Set

# Standard 118 chemical elements
VALID_ELEMENTS: Set[str] = {
    "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
    "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
    "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
    "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
    "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn",
    "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
    "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb",
    "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
    "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th",
    "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm",
    "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
    "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"
}

# Common material names to formula mappings
NAME_TO_FORMULA: Dict[str, str] = {
    "graphene": "C",
    "graphite": "C",
    "diamond": "C",
    "silica": "SiO2",
    "quartz": "SiO2",
    "alumina": "Al2O3",
    "titania": "TiO2",
    "rutile": "TiO2",
    "anatase": "TiO2",
    "gallium arsenide": "GaAs",
    "silicon": "Si",
    "salt": "NaCl",
    "halite": "NaCl",
    "water": "H2O",
    "ice": "H2O",
    "perovskite": "CaTiO3",
    "magnetite": "Fe3O4",
    "hematite": "Fe2O3",
    "wurtzite": "ZnS",
    "zincblende": "ZnS"
}

class FormulaValidator:
    """
    Validates, parses, and normalizes chemical formulas.
    Preserves chemical semantics while normalizing case (e.g., 'gaas' -> 'GaAs').
    """

    @classmethod
    def normalize_input(cls, text: str) -> str:
        """
        Trims and checks if input is a known common name, or normalizes element casing.
        """
        clean = text.strip()
        lower = clean.lower()
        if lower in NAME_TO_FORMULA:
            return NAME_TO_FORMULA[lower]

        # If it's already properly cased or has standard formula characters
        if cls.is_valid_formula(clean):
            return clean

        # Attempt to auto-fix all-lowercase inputs like 'sio2' -> 'SiO2'
        corrected = cls._try_autocase_formula(clean)
        if corrected and cls.is_valid_formula(corrected):
            return corrected

        return clean

    @classmethod
    def _try_autocase_formula(cls, text: str) -> Optional[str]:
        # Greedily match 2-letter element then 1-letter element followed by numbers
        i = 0
        n = len(text)
        result = []
        while i < n:
            # Check two letters first
            if i + 1 < n and text[i:i+2].capitalize() in VALID_ELEMENTS:
                elem = text[i:i+2].capitalize()
                result.append(elem)
                i += 2
            elif text[i].upper() in VALID_ELEMENTS:
                elem = text[i].upper()
                result.append(elem)
                i += 1
            elif text[i].isdigit() or text[i] in "().":
                result.append(text[i])
                i += 1
            else:
                return None
        return "".join(result)

    @classmethod
    def is_valid_formula(cls, formula: str) -> bool:
        """
        Checks if the formula contains only valid chemical elements and counts.
        """
        if not formula or not isinstance(formula, str):
            return False
        
        formula = formula.strip()
        if len(formula) == 0:
            return False

        # Support pymatgen Composition parsing if available
        try:
            from pymatgen.core import Composition
            comp = Composition(formula)
            # Check all elements exist
            for elem in comp.elements:
                if elem.symbol not in VALID_ELEMENTS:
                    return False
            return len(comp.elements) > 0
        except Exception:
            pass

        # Regex fallback: element symbols (e.g. Ca, Mg, C, O) optionally followed by numbers
        tokens = re.findall(r"([A-Z][a-z]?|\d+|[()]|\.)", formula)
        reconstructed = "".join(tokens)
        if reconstructed != formula:
            return False

        elements_found = re.findall(r"([A-Z][a-z]?)", formula)
        if not elements_found:
            return False

        for elem in elements_found:
            if elem not in VALID_ELEMENTS:
                return False

        return True

    @classmethod
    def parse_composition(cls, formula: str) -> Dict[str, float]:
        """
        Returns a dictionary of element counts.
        """
        try:
            from pymatgen.core import Composition
            comp = Composition(formula)
            return {elem.symbol: float(amt) for elem, amt in comp.fractional_composition.items()}
        except Exception:
            # Simple regex fallback
            matches = re.findall(r"([A-Z][a-z]?)([\d\.]*)", formula)
            comp = {}
            for elem, amt in matches:
                if elem in VALID_ELEMENTS:
                    comp[elem] = float(amt) if amt else 1.0
            total = sum(comp.values()) or 1.0
            return {k: v / total for k, v in comp.items()}

formula_validator = FormulaValidator()
