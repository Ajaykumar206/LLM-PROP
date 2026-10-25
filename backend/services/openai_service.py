import os
import json
from typing import Dict, Any, Optional
from backend.utils.config import settings
from backend.utils.logging_config import logger

class OpenAIService:
    """
    Interfaces with OpenAI API for scientific explanations and material summaries.
    Conforms to config/llm_config.yaml and never exposes keys.
    """
    def __init__(self):
        self.config = settings.get_llm_config()

    @property
    def api_key(self) -> Optional[str]:
        return settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def generate_scientific_explanation(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Calls OpenAI API using the configured model (e.g., gpt-4o-mini).
        Returns the text response and token usage.
        """
        if not self.is_configured():
            logger.info("OpenAI API key is not configured.")
            return None

        model_name = self.config.get("model", "gpt-4o-mini")
        temperature = float(self.config.get("temperature", 0.2))
        max_tokens = int(self.config.get("max_output_tokens", 1500))
        fallback_model = self.config.get("fallback_model", "gpt-3.5-turbo")

        try:
            import openai
            client = openai.OpenAI(api_key=self.api_key)

            system_instruction = (
                "You are an expert materials scientist and solid-state physicist. "
                "Provide accurate, rigorous, and grounded scientific analysis of the given crystalline material. "
                "Base your explanations strictly on the provided crystal structure, physical properties, "
                "and model predictions. Do NOT hallucinate unverified stability claims or properties that are marked missing. "
                "Return a well-structured response with clear headings."
            )

            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            except Exception as e:
                logger.warning(f"OpenAI call with {model_name} failed: {e}. Trying fallback model {fallback_model}...")
                response = client.chat.completions.create(
                    model=fallback_model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )

            choice = response.choices[0]
            content = choice.message.content or ""
            tokens = response.usage.total_tokens if response.usage else None

            return {
                "text": content,
                "model": response.model,
                "tokens_used": tokens
            }

        except Exception as e:
            logger.error(f"OpenAI API request exception: {e}")
            return None

openai_service = OpenAIService()
