import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    VERSION: str = "2.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    # API Keys (loaded from environment or .env)
    GEMINI_API_KEY: str = ""
    MP_API_KEY: str = ""


    # Path Settings
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
    FAILED_DIR: Path = DATA_DIR / "failed"

    # Model Subpaths
    T5_MODEL_DIR: Path = MODELS_DIR / "t5_finetuned"
    CHECKPOINTS_DIR: Path = MODELS_DIR / "checkpoints"
    TOKENIZER_DIR: Path = MODELS_DIR / "tokenizer"
    METADATA_DIR: Path = MODELS_DIR / "model_metadata"

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
