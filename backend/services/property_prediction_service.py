from typing import Dict, Any, Optional
from backend.utils.validators import formula_validator
from backend.models.t5_predictor import t5_predictor
from backend.schemas.prediction_schema import PredictionRequest, PredictionResponse

class PropertyPredictionService:
    """
    Coordinates material property inference using the fine-tuned T5 model.
    """
    def __init__(self):
        self.predictor = t5_predictor

    def predict(self, req: PredictionRequest) -> PredictionResponse:
        formula = req.formula.strip()
        norm_formula = formula_validator.normalize_input(formula)

        warnings = []
        if not formula_validator.is_valid_formula(norm_formula):
            warnings.append(f"Formula '{formula}' may contain non-standard formatting.")

        predictions = self.predictor.predict_properties(
            formula=norm_formula,
            crystal_system=req.crystal_system,
            space_group=req.space_group
        )

        desc = self.predictor.generate_crystal_description(
            formula=norm_formula,
            crystal_system=req.crystal_system
        )

        return PredictionResponse(
            formula=formula,
            normalized_formula=norm_formula,
            predictions=predictions,
            crystal_description=desc,
            status="success",
            warnings=warnings
        )

property_prediction_service = PropertyPredictionService()
