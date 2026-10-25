from typing import Dict, Any, Optional
from src.models.t5_predictor import t5_predictor
from src.knowledge.material_resolver import material_resolver
from src.input_processing.formula_parser import formula_parser

class PropertyPredictionService:
    """
    Coordinates property prediction for crystalline solids across models and database lookups.
    """
    def __init__(self):
        self.t5_predictor = t5_predictor
        self.resolver = material_resolver

    def predict(
        self,
        formula: str,
        crystal_system: Optional[str] = None,
        space_group: Optional[str] = None
    ) -> Dict[str, Any]:
        if not formula_parser.is_valid_formula(formula):
            return {
                "success": False,
                "error": f"Invalid chemical formula: '{formula}'",
                "predictions": {}
            }

        # Check database records first
        db_records = self.resolver.find_by_formula(formula)
        db_match = db_records[0] if db_records else None

        # Predict using T5
        cs = crystal_system or (db_match.get("crystal_system") if db_match else "Cubic")
        spg = space_group or (db_match.get("space_group") if db_match else "Pm-3m")

        t5_result = self.t5_predictor.predict_properties(formula, cs, spg)
        t5_desc = self.t5_predictor.predict_description(formula, cs)

        return {
            "success": True,
            "formula": formula,
            "crystal_system": cs,
            "space_group": spg,
            "is_in_database": db_match is not None,
            "database_properties": {
                "band_gap_eV": db_match.get("band_gap_eV") if db_match else None,
                "formation_energy_eV_atom": db_match.get("formation_energy_eV_atom") if db_match else None,
                "density_g_cm3": db_match.get("density_g_cm3") if db_match else None,
            } if db_match else {},
            "model_predictions": t5_result.get("predictions", {}),
            "generated_description": t5_desc.get("description"),
            "model_status": t5_result.get("status")
        }

property_prediction_service = PropertyPredictionService()
