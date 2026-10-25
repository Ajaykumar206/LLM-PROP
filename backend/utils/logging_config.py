import logging
import sys
from pathlib import Path
from backend.utils.config import settings

def setup_logger(name: str = "llm_prop") -> logging.Logger:
    settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_file = settings.LOGS_DIR / "llm_prop.log"

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers
    if not logger.handlers:
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        # Console handler
        c_handler = logging.StreamHandler(sys.stdout)
        c_handler.setFormatter(formatter)
        c_handler.setLevel(logging.INFO)
        logger.addHandler(c_handler)

        # File handler
        try:
            f_handler = logging.FileHandler(log_file, encoding="utf-8")
            f_handler.setFormatter(formatter)
            f_handler.setLevel(logging.INFO)
            logger.addHandler(f_handler)
        except Exception:
            pass

    return logger

logger = setup_logger()
