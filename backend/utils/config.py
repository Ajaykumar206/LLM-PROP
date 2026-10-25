import os
from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator
import yaml
from pydantic_settings import BaseSettings

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "LLM-Prop"
    VERSION: str = "2.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # API Keys loaded securely from environment variables (or .env)
    OPENAI_API_KEY: Optional[str] = None
    MP_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Directory Paths
    BASE_DIR: Path = BASE_DIR
    CONFIG_DIR: Path = BASE_DIR / "config"
    DATA_DIR: Path = BASE_DIR / "data"
    MODELS_DIR: Path = BASE_DIR / "models"
    OUTPUTS_DIR: Path = BASE_DIR / "outputs"
    LOGS_DIR: Path = BASE_DIR / "logs"

    # Data Subpaths
    RAW_DATA_PATH: Path = DATA_DIR / "raw" / "materials_project_10000.csv"
    PROCESSED_DATA_PATH: Path = DATA_DIR / "processed" / "materials_with_bandgap_10000.csv"
    STRUCTURES_CIF_DIR: Path = DATA_DIR / "structures_cif"
    ROBOCRYS_DIR: Path = DATA_DIR / "robocrys_batches"
    SPLITS_DIR: Path = DATA_DIR / "splits"
    KNOWLEDGE_BASE_DIR: Path = DATA_DIR / "knowledge_base"

    # Model Subpaths (Strictly T5)
    T5_MODEL_DIR: Path = MODELS_DIR / "t5_finetuned"
    CHECKPOINTS_DIR: Path = MODELS_DIR / "checkpoints"
    TOKENIZER_DIR: Path = MODELS_DIR / "tokenizer"
    METADATA_DIR: Path = MODELS_DIR / "model_metadata"

    # LLM Config
    LLM_CONFIG_FILE: Path = CONFIG_DIR / "llm_config.yaml"

    def get_llm_config(self) -> dict:
        if self.LLM_CONFIG_FILE.exists():
            try:
                with open(self.LLM_CONFIG_FILE, "r", encoding="utf-8") as f:
                    return yaml.safe_load(f) or {}
            except Exception:
                pass
        return {
            "provider": "openai",
            "model": "gpt-4o-mini",
            "temperature": 0.2,
            "max_output_tokens": 1500,
            "fallback_model": "gpt-3.5-turbo"
        }

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
