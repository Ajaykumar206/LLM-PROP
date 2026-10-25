from typing import Dict, Any, Optional
from src.models.t5_predictor import t5_predictor, T5PropertyPredictor
from src.utils.logging_config import logger

class ModelRegistry:
    """
    Central registry managing machine learning models for materials property inference.
    """
    def __init__(self):
        self.t5_predictor: T5PropertyPredictor = t5_predictor

    def load_all_models(self) -> Dict[str, bool]:
        logger.info("Initializing models in ModelRegistry...")
        status = {}
        try:
            status["t5"] = self.t5_predictor.load()
        except Exception as e:
            logger.warning(f"Could not initialize T5 model: {e}")
            status["t5"] = False
        return status

    def get_t5_predictor(self) -> T5PropertyPredictor:
        return self.t5_predictor

model_registry = ModelRegistry()
