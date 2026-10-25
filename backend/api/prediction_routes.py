from fastapi import APIRouter
from backend.services.property_prediction_service import property_prediction_service
from backend.services.explanation_service import explanation_service
from backend.schemas.prediction_schema import (
    PredictionRequest,
    PredictionResponse,
    ExplanationRequest,
    ExplanationResponse
)

router = APIRouter(tags=["Predictions & AI Explanations"])

@router.post("/predictions", response_model=PredictionResponse)
def predict_properties(req: PredictionRequest) -> PredictionResponse:
    return property_prediction_service.predict(req)

@router.post("/explanations", response_model=ExplanationResponse)
def generate_explanation(req: ExplanationRequest) -> ExplanationResponse:
    return explanation_service.generate_explanation(req)
