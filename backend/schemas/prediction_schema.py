from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SinglePropertyPrediction(BaseModel):
    property_name: str
    target_key: str
    predicted_value: float
    formatted_value: str
    unit: str
    model_name: str
    model_type: str = "T5 Sequence-to-Sequence"
    is_trained: bool = True
    train_mae: Optional[float] = None
    train_r2: Optional[float] = None
    test_mae: Optional[float] = None
    test_r2: Optional[float] = None
    uncertainty_95ci: Optional[str] = None
    features_used: List[str] = Field(default_factory=list)

class PredictionRequest(BaseModel):
    formula: str
    crystal_system: Optional[str] = None
    space_group: Optional[str] = None

class PredictionResponse(BaseModel):
    formula: str
    normalized_formula: str
    predictions: Dict[str, SinglePropertyPrediction]
    crystal_description: Optional[str] = None
    status: str = "success"
    warnings: List[str] = Field(default_factory=list)

class ExplanationRequest(BaseModel):
    material_id: Optional[str] = None
    formula: str
    crystal_system: Optional[str] = None
    space_group: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    predicted_properties: Dict[str, Any] = Field(default_factory=dict)
    robocrys_text: Optional[str] = None

class ExplanationResponse(BaseModel):
    formula: str
    material_id: Optional[str] = None
    summary: str
    crystal_structure_analysis: str
    physical_and_electronic_properties: str
    stability_and_thermodynamics: str
    potential_applications: List[str]
    limitations_and_uncertainties: str
    raw_markdown: str
    model_used: str
    tokens_used: Optional[int] = None
