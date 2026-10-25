import json
from pathlib import Path
from typing import Dict, Any, Optional
from backend.utils.config import settings
from backend.utils.logging_config import logger

class ModelLoader:
    """
    Central loader for T5 model checkpoints and metadata.
    Strictly restricted to T5 model per architectural specifications.
    """
    def __init__(self, checkpoint_dir: Optional[Path] = None):
        self.checkpoint_dir = Path(checkpoint_dir or settings.T5_MODEL_DIR)
        self.metadata_dir = settings.METADATA_DIR

    def has_trained_weights(self) -> bool:
        if not self.checkpoint_dir.exists():
            return False
        weight_files = (
            list(self.checkpoint_dir.glob("*.bin")) +
            list(self.checkpoint_dir.glob("*.safetensors")) +
            list(self.checkpoint_dir.glob("spiece.model"))
        )
        return len(weight_files) > 0

    def load_evaluation_metrics(self) -> Dict[str, Any]:
        """
        Loads the latest verified metrics from training and evaluation.
        """
        paths = [
            self.metadata_dir / "t5_evaluation_metrics.json",
            self.checkpoint_dir / "metrics.json",
            settings.OUTPUTS_DIR / "reports" / "t5_evaluation_report.json"
        ]
        for p in paths:
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    logger.warning(f"Error loading metrics from {p}: {e}")
        return {}

model_loader = ModelLoader()
