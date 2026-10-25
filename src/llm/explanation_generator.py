import os
import json
from typing import Dict, Any, Optional
import httpx
from src.utils.config import settings
from src.utils.logging_config import logger

class GeminiExplanationGenerator:
    """
    Generates expert physical and crystallographic material descriptions using Google Gemini API.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    def generate_explanation(
        self,
        formula: str,
        band_gap: Optional[float] = None,
        formation_energy: Optional[float] = None,
        density: Optional[float] = None,
        crystal_system: Optional[str] = None,
        space_group: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates comprehensive text description of a material using Google Gemini API.
        """
        prompt = (
            f"You are a solid-state physics and materials science expert.\n"
            f"Provide an insightful, scientific explanation for the crystalline material with the following properties:\n"
            f"- Formula: {formula}\n"
            f"- Crystal System: {crystal_system or 'Unknown'}\n"
            f"- Space Group: {space_group or 'Unknown'}\n"
            f"- Band Gap: {band_gap if band_gap is not None else 'N/A'} eV\n"
            f"- Formation Energy per Atom: {formation_energy if formation_energy is not None else 'N/A'} eV/atom\n"
            f"- Density: {density if density is not None else 'N/A'} g/cm³\n\n"
            f"Address:\n"
            f"1. Electronic classification (metallic conductor, semiconductor, or wide-bandgap insulator) and implications.\n"
            f"2. Thermodynamic stability inferred from formation energy.\n"
            f"3. Common or potential technological applications for this material class.\n"
            f"Keep your response concise, clear, and professional (under 120 words)."
        )

        gemini_text = self._call_gemini_api(prompt)
        if gemini_text:
            return {
                "source": "Google Gemini 1.5 Flash",
                "formula": formula,
                "explanation": gemini_text,
                "status": "success"
            }

        # Fallback physics-based description if API is unreachable
        return self._heuristic_explanation(formula, band_gap, formation_energy, density, crystal_system)

    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not configured. Falling back to heuristic description.")
            return None

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 300
            }
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    self.api_url,
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
                            logger.info(f"Generated Gemini explanation successfully for material.")
                            return text
                else:
                    logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")

        return None

    def _heuristic_explanation(
        self,
        formula: str,
        band_gap: Optional[float] = None,
        formation_energy: Optional[float] = None,
        density: Optional[float] = None,
        crystal_system: Optional[str] = None
    ) -> Dict[str, Any]:
        cs = crystal_system or "crystalline"
        bg_desc = (
            "metallic conductor (zero band gap)" if band_gap is not None and band_gap == 0
            else f"semiconductor with an energy gap of {band_gap:.2f} eV" if band_gap is not None and band_gap < 3.0
            else f"wide-bandgap insulator ({band_gap:.2f} eV)" if band_gap is not None
            else "undetermined electronic state"
        )
        fe_desc = (
            "highly thermodynamically stable" if formation_energy is not None and formation_energy < -1.5
            else "moderately stable compound" if formation_energy is not None and formation_energy < 0
            else "metastable or high-energy phase"
        )
        dens_str = f" with an estimated density of {density:.2f} g/cm³" if density else ""

        text = (
            f"{formula} crystallizes in a {cs} lattice{dens_str}. "
            f"Based on its electronic structure, it exhibits {bg_desc}. "
            f"From a thermodynamic viewpoint, the negative formation energy of {formation_energy if formation_energy is not None else 'N/A'} eV/atom "
            f"indicates that this phase is {fe_desc}."
        )

        return {
            "source": "LLM-Prop Heuristic Physics Engine",
            "formula": formula,
            "explanation": text,
            "status": "fallback"
        }

explanation_generator = GeminiExplanationGenerator()
