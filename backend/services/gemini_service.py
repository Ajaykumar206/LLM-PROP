import os
import json
from typing import Dict, Any, Optional, List
import httpx
from backend.utils.config import settings
from backend.utils.logging_config import logger

class GeminiService:
    """
    Interfaces with Google Gemini API for materials physical descriptions,
    crystallographic analysis, and scientific reasoning.
    """
    def __init__(self):
        self.config = settings.get_llm_config()

    @property
    def api_key(self) -> str:
        return (
            os.environ.get("GEMINI_API_KEY") or
            settings.GEMINI_API_KEY or
            ""
        )


    def is_configured(self) -> bool:
        k = self.api_key
        return bool(k and len(k.strip()) > 10)

    def generate_scientific_explanation(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Calls Gemini API using httpx to generate grounded scientific text.
        Cycles through supported candidate models and handles network disconnects cleanly.
        """
        if not self.is_configured():
            logger.warning("Gemini API key is not configured.")
            return None

        candidate_models: List[str] = [
            self.config.get("model", "gemini-1.5-flash"),
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-pro"
        ]

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": float(self.config.get("temperature", 0.2)),
                "maxOutputTokens": int(self.config.get("max_output_tokens", 1000))
            }
        }

        # Try models in order
        seen_models = set()
        for model_name in candidate_models:
            if model_name in seen_models:
                continue
            seen_models.add(model_name)

            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            try:
                with httpx.Client(timeout=5.0) as client:
                    resp = client.post(
                        api_url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = parts[0].get("text", "").strip()
                                usage = data.get("usageMetadata", {})
                                tokens = usage.get("totalTokenCount")
                                logger.info(f"Generated Gemini explanation successfully using model {model_name}.")
                                return {
                                    "text": text,
                                    "model": f"Google Gemini ({model_name})",
                                    "tokens_used": tokens
                                }
                    else:
                        logger.warning(f"Gemini API ({model_name}) returned status {resp.status_code}")
            except Exception as e:
                logger.warning(f"Gemini API request ({model_name}) exception: {e}")

        return None

gemini_service = GeminiService()
