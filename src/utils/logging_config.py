import sys
import logging
from pathlib import Path
from src.utils.config import settings

def setup_logger(name: str = "llm_prop") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # File handler
        settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(settings.LOGS_DIR / "llm_prop.log", encoding="utf-8")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger

logger = setup_logger()
