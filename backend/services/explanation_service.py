import re
from typing import Dict, Any, Optional, List
from backend.services.gemini_service import gemini_service
from backend.services.openai_service import openai_service
from backend.utils.config import settings
from backend.utils.logging_config import logger
from backend.schemas.prediction_schema import ExplanationRequest, ExplanationResponse

class ExplanationService:
    """
    Coordinates AI explanation generation grounded strictly on retrieved scientific data.
    Uses Google Gemini as primary text generator with OpenAI and physics heuristics fallback.
    """
    def generate_explanation(self, req: ExplanationRequest) -> ExplanationResponse:
        formula = req.formula
        mid = req.material_id or "Unknown"
        cs = req.crystal_system or "Unknown"
        spg = req.space_group or "Unknown"

        # Combine retrieved properties and predicted properties
        props = req.properties
        pred_props = req.predicted_properties

        # Extract values
        bg = self._get_numeric_prop(props, pred_props, "band_gap", "band_gap_eV")
        fe = self._get_numeric_prop(props, pred_props, "formation_energy", "formation_energy_eV_atom")
        dens = self._get_numeric_prop(props, pred_props, "density", "density_g_cm3")
        ehull = self._get_numeric_prop(props, pred_props, "energy_above_hull", "energy_above_hull_eV_atom")

        prompt = self._build_prompt(
            formula=formula,
            material_id=mid,
            crystal_system=cs,
            space_group=spg,
            band_gap=bg,
            formation_energy=fe,
            density=dens,
            energy_above_hull=ehull,
            robocrys_text=req.robocrys_text
        )

        # 1. Primary: Google Gemini API as requested by the user
        if gemini_service.is_configured():
            g_res = gemini_service.generate_scientific_explanation(prompt)
            if g_res and g_res.get("text"):
                return self._parse_explanation_text(
                    text=g_res["text"],
                    formula=formula,
                    material_id=mid,
                    model_used=g_res.get("model", "Google Gemini"),
                    tokens_used=g_res.get("tokens_used")
                )

        # 2. Alternate: OpenAI API if configured
        if openai_service.is_configured():
            ai_res = openai_service.generate_scientific_explanation(prompt)
            if ai_res and ai_res.get("text"):
                return self._parse_explanation_text(
                    text=ai_res["text"],
                    formula=formula,
                    material_id=mid,
                    model_used=ai_res.get("model", "OpenAI"),
                    tokens_used=ai_res.get("tokens_used")
                )

        # 2. Grounded heuristic scientific generator fallback
        return self._generate_grounded_fallback(
            formula=formula,
            material_id=mid,
            crystal_system=cs,
            space_group=spg,
            band_gap=bg,
            formation_energy=fe,
            density=dens,
            energy_above_hull=ehull
        )

    def _extract_float(self, obj: Any) -> Optional[float]:
        if obj is None:
            return None
        if isinstance(obj, (int, float)):
            return float(obj)
        if isinstance(obj, dict):
            for field in ["value", "predicted_value"]:
                if field in obj and obj[field] is not None:
                    return self._extract_float(obj[field])
        if hasattr(obj, "value") and getattr(obj, "value") is not None:
            return self._extract_float(getattr(obj, "value"))
        if hasattr(obj, "predicted_value") and getattr(obj, "predicted_value") is not None:
            return self._extract_float(getattr(obj, "predicted_value"))
        try:
            return float(str(obj))
        except (ValueError, TypeError):
            return None

    def _get_numeric_prop(self, props: Any, pred_props: Any, *keys) -> Optional[float]:
        props = props or {}
        pred_props = pred_props or {}
        for k in keys:
            if isinstance(props, dict) and k in props:
                res = self._extract_float(props[k])
                if res is not None:
                    return res
            if isinstance(pred_props, dict) and k in pred_props:
                res = self._extract_float(pred_props[k])
                if res is not None:
                    return res
        return None

    def _build_prompt(
        self,
        formula: str,
        material_id: str,
        crystal_system: str,
        space_group: str,
        band_gap: Optional[float],
        formation_energy: Optional[float],
        density: Optional[float],
        energy_above_hull: Optional[float],
        robocrys_text: Optional[str] = None
    ) -> str:
        prompt = (
            f"Please generate a comprehensive scientific report for the crystalline material {formula} (ID: {material_id}).\n\n"
            f"VERIFIED MATERIAL DATA:\n"
            f"- Formula: {formula}\n"
            f"- Material ID: {material_id}\n"
            f"- Crystal System: {crystal_system}\n"
            f"- Space Group: {space_group}\n"
            f"- Band Gap: {f'{band_gap:.3f} eV' if band_gap is not None else 'Not Available'}\n"
            f"- Formation Energy per Atom: {f'{formation_energy:.3f} eV/atom' if formation_energy is not None else 'Not Available'}\n"
            f"- Energy Above Hull: {f'{energy_above_hull:.4f} eV/atom' if energy_above_hull is not None else 'Not Available'}\n"
            f"- Density: {f'{density:.3f} g/cm³' if density is not None else 'Not Available'}\n"
        )
        if robocrys_text:
            prompt += f"- Crystallographic Structure Description: {robocrys_text}\n"

        prompt += (
            "\nREQUIREMENTS:\n"
            "Format your answer under the following exact Markdown headers:\n"
            "### Summary\n"
            "### Crystal Structure Analysis\n"
            "### Physical & Electronic Properties\n"
            "### Stability & Thermodynamics\n"
            "### Potential Applications\n"
            "### Limitations & Uncertainties\n\n"
            "Important scientific rules:\n"
            "- Do not invent missing values or experimental measurements.\n"
            "- If a property is marked 'Not Available', explicitly state that it has not been determined.\n"
            "- Ground applications strictly on the confirmed electronic state (e.g. semiconductor, metallic, insulator)."
        )
        return prompt

    def _parse_explanation_text(
        self,
        text: str,
        formula: str,
        material_id: str,
        model_used: str,
        tokens_used: Optional[int]
    ) -> ExplanationResponse:
        def extract_section(title: str, next_titles: List[str]) -> str:
            pat = rf"###\s*{title}([\s\S]*?)(?=###|$)"
            m = re.search(pat, text, re.IGNORECASE)
            return m.group(1).strip() if m else ""

        summary = extract_section("Summary", ["Crystal Structure Analysis"])
        struct = extract_section("Crystal Structure Analysis", ["Physical & Electronic Properties"])
        props = extract_section("Physical & Electronic Properties", ["Stability & Thermodynamics"])
        stab = extract_section("Stability & Thermodynamics", ["Potential Applications"])
        apps_raw = extract_section("Potential Applications", ["Limitations & Uncertainties"])
        limits = extract_section("Limitations & Uncertainties", [])

        # Parse application bullet points
        apps = [line.strip("- *").strip() for line in apps_raw.split("\n") if line.strip().startswith(("-", "*"))]
        if not apps and apps_raw:
            apps = [a.strip() for a in apps_raw.split(".") if len(a.strip()) > 10][:4]

        return ExplanationResponse(
            formula=formula,
            material_id=material_id,
            summary=summary or f"{formula} is a crystalline compound analyzed via Materials Project database and T5 property prediction.",
            crystal_structure_analysis=struct or "Crystal structure parameters conform to standard crystallographic definitions.",
            physical_and_electronic_properties=props or "Electronic properties reflect calculated bandgap and density.",
            stability_and_thermodynamics=stab or "Thermodynamic stability is evaluated relative to the convex hull.",
            potential_applications=apps if apps else ["Solid-state physics research", "Materials engineering"],
            limitations_and_uncertainties=limits or "Calculated DFT values typically underestimate experimental band gaps by 20-30%.",
            raw_markdown=text,
            model_used=model_used,
            tokens_used=tokens_used
        )

    def _generate_grounded_fallback(
        self,
        formula: str,
        material_id: str,
        crystal_system: str,
        space_group: str,
        band_gap: Optional[float],
        formation_energy: Optional[float],
        density: Optional[float],
        energy_above_hull: Optional[float]
    ) -> ExplanationResponse:
        # Determine electronic classification
        if band_gap is not None:
            if band_gap == 0.0:
                elec_type = "a metallic conductor with zero band gap, characterized by partially filled bands at the Fermi level."
                apps = ["Electrical contacts", "Conductive electrode materials", "Interconnects in microelectronics"]
            elif band_gap < 2.0:
                elec_type = f"a narrow-to-moderate bandgap semiconductor ({band_gap:.2f} eV), suitable for optoelectronic and photovoltaic absorption."
                apps = ["Photovoltaic solar cell absorbers", "Near-infrared photodetectors", "Semiconductor thermoelectrics"]
            elif band_gap < 4.0:
                elec_type = f"a wide-bandgap semiconductor ({band_gap:.2f} eV), offering high breakdown fields and UV transparency."
                apps = ["Power electronics devices", "UV optoelectronics & LEDs", "High-temperature sensors"]
            else:
                elec_type = f"a dielectric insulator with a large band gap ({band_gap:.2f} eV)."
                apps = ["Dielectric gate layers", "Thermal barrier coatings", "Passivation layers"]
        else:
            elec_type = "an undetermined electronic state due to unavailable band gap data."
            apps = ["Solid-state materials exploration"]

        # Thermodynamic stability
        if energy_above_hull is not None:
            if energy_above_hull <= 0.001:
                stab_desc = f"Thermodynamically stable (energy above hull: {energy_above_hull:.4f} eV/atom), residing on the ground-state convex hull."
            elif energy_above_hull <= 0.050:
                stab_desc = f"Synthesizable metastable phase ({energy_above_hull:.4f} eV/atom above hull), within thermal synthesis reach (k_B * 300K ≈ 0.026 eV)."
            else:
                stab_desc = f"High-energy metastable phase ({energy_above_hull:.4f} eV/atom above hull); requires high-pressure or non-equilibrium synthesis."
        elif formation_energy is not None:
            stab_desc = f"Exhibits a negative formation energy of {formation_energy:.3f} eV/atom, signifying thermodynamic stability against elemental decomposition."
        else:
            stab_desc = "Thermodynamic stability metrics are currently not available in this dataset record."

        dens_str = f"{density:.2f} g/cm³" if density is not None else "unspecified"

        summary = f"{formula} ({material_id}) is a crystalline solid crystallizing in the {crystal_system} crystal system (space group {space_group})."
        struct_desc = f"The lattice adopts a {crystal_system} symmetry with space group {space_group}. The calculated mass density is {dens_str}."
        props_desc = f"Based on density functional theory calculations and T5 model predictions, the compound displays {elec_type}"
        limits_desc = "Standard GGA/PBE DFT and sequence-to-sequence predictions carry systematic uncertainties. Band gaps may be underestimated relative to experimental GW/hybrid functional benchmarks."

        raw_md = (
            f"### Summary\n{summary}\n\n"
            f"### Crystal Structure Analysis\n{struct_desc}\n\n"
            f"### Physical & Electronic Properties\n{props_desc}\n\n"
            f"### Stability & Thermodynamics\n{stab_desc}\n\n"
            f"### Potential Applications\n" + "\n".join([f"- {a}" for a in apps]) + "\n\n"
            f"### Limitations & Uncertainties\n{limits_desc}\n"
        )

        return ExplanationResponse(
            formula=formula,
            material_id=material_id,
            summary=summary,
            crystal_structure_analysis=struct_desc,
            physical_and_electronic_properties=props_desc,
            stability_and_thermodynamics=stab_desc,
            potential_applications=apps,
            limitations_and_uncertainties=limits_desc,
            raw_markdown=raw_md,
            model_used="LLM-Prop Scientific Reasoning Engine (Physics Grounded)",
            tokens_used=None
        )

explanation_service = ExplanationService()
