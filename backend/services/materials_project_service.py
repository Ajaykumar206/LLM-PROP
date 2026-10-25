import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.utils.config import settings
from backend.utils.logging_config import logger

class MaterialsProjectService:
    """
    Interfaces with Materials Project API via mp-api.
    Fetches crystal structures (CIF) and summaries, with local disk caching.
    """
    def __init__(self):
        self.cif_dir = settings.STRUCTURES_CIF_DIR
        self.cif_dir.mkdir(parents=True, exist_ok=True)

    @property
    def api_key(self) -> Optional[str]:
        return settings.MP_API_KEY or os.environ.get("MP_API_KEY")

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def get_cif(self, material_id: str) -> Optional[str]:
        """
        Retrieves CIF string from local storage, or fetches from Materials Project API if missing.
        """
        clean_id = material_id.strip()
        local_cif_path = self.cif_dir / f"{clean_id}.cif"

        if local_cif_path.exists():
            try:
                with open(local_cif_path, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                logger.warning(f"Error reading local CIF {local_cif_path}: {e}")

        # Fetch from Materials Project API
        if not self.is_configured():
            logger.info("Materials Project API key not configured; skipping remote fetch.")
            return None

        cif_content = self.fetch_cif_from_api(clean_id)
        if cif_content:
            try:
                with open(local_cif_path, "w", encoding="utf-8") as f:
                    f.write(cif_content)
                logger.info(f"Saved fetched CIF for {clean_id} to {local_cif_path}")
            except Exception as e:
                logger.warning(f"Failed to cache CIF for {clean_id}: {e}")
            return cif_content

        return None

    def fetch_cif_from_api(self, material_id: str) -> Optional[str]:
        mid = material_id.strip()
        
        try:
            from mp_api.client import MPRester
            with MPRester(api_key=self.api_key) as mpr:
                # If it's a direct MP ID (e.g., mp-149)
                if mid.lower().startswith("mp-") or mid.lower().startswith("mvc-"):
                    logger.info(f"Querying Materials Project API for structure of {mid}...")
                    structure = mpr.get_structure_by_material_id(mid)
                    return structure.to(fmt="cif")
                else:
                    # It's a formula (e.g., GaAs, SiO2)
                    logger.info(f"Querying Materials Project API by formula {mid} for ground state structure...")
                    docs = mpr.materials.summary.search(formula=mid, num_chunks=1, chunk_size=5)
                    if docs:
                        # Pick most stable (is_stable=True or lowest energy_above_hull)
                        sorted_docs = sorted(docs, key=lambda d: (not bool(d.is_stable), getattr(d, 'energy_above_hull', 999.0)))
                        best_mid = str(sorted_docs[0].material_id)
                        logger.info(f"Resolved formula '{mid}' to ground-state {best_mid}; fetching structure...")
                        structure = mpr.get_structure_by_material_id(best_mid)
                        return structure.to(fmt="cif")
        except Exception as e:
            logger.warning(f"Materials Project API structure query failed for {mid}: {e}")
            return None

    def get_material_by_id(self, material_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves complete material properties, lattice, and structure for a material ID from Materials Project API.
        """
        if not self.is_configured():
            return None

        mid = material_id.strip()
        try:
            from mp_api.client import MPRester
            logger.info(f"Fetching material details for {mid} from Materials Project API...")
            with MPRester(api_key=self.api_key) as mpr:
                docs = mpr.materials.summary.search(material_ids=[mid], num_chunks=1, chunk_size=1)
                if docs:
                    doc = docs[0]
                    lat = getattr(doc.structure, "lattice", None) if hasattr(doc, "structure") and doc.structure else None
                    rec = {
                        "material_id": str(doc.material_id),
                        "formula": str(doc.formula_pretty),
                        "crystal_system": str(doc.symmetry.crystal_system.value) if hasattr(doc.symmetry, "crystal_system") else "Unknown",
                        "space_group": str(doc.symmetry.symbol) if hasattr(doc.symmetry, "symbol") else "Unknown",
                        "space_group_number": int(doc.symmetry.number) if hasattr(doc.symmetry, "number") else 0,
                        "energy_above_hull_eV_atom": round(float(doc.energy_above_hull), 4) if doc.energy_above_hull is not None else 0.0,
                        "is_stable": bool(doc.is_stable) if doc.is_stable is not None else False,
                        "band_gap_eV": round(float(doc.band_gap), 3) if doc.band_gap is not None else 0.0,
                        "density_g_cm3": round(float(doc.density), 3) if doc.density is not None else 0.0,
                        "volume_A3": round(float(doc.volume), 3) if doc.volume is not None else 0.0,
                        "formation_energy_eV_atom": round(float(doc.formation_energy_per_atom), 4) if hasattr(doc, "formation_energy_per_atom") and doc.formation_energy_per_atom is not None else None,
                        "source": "Materials Project API (Online)",
                        "lattice_a_A": round(float(lat.a), 4) if lat else 5.0,
                        "lattice_b_A": round(float(lat.b), 4) if lat else 5.0,
                        "lattice_c_A": round(float(lat.c), 4) if lat else 5.0,
                        "alpha_degree": round(float(lat.alpha), 2) if lat else 90.0,
                        "beta_degree": round(float(lat.beta), 2) if lat else 90.0,
                        "gamma_degree": round(float(lat.gamma), 2) if lat else 90.0,
                    }
                    local_cif_path = self.cif_dir / f"{mid}.cif"
                    if not local_cif_path.exists() and hasattr(doc, "structure") and doc.structure:
                        try:
                            cif_str = doc.structure.to(fmt="cif")
                            with open(local_cif_path, "w", encoding="utf-8") as f:
                                f.write(cif_str)
                            logger.info(f"Cached CIF for {mid} to {local_cif_path}")
                        except Exception as e:
                            logger.warning(f"Failed to cache CIF for {mid}: {e}")
                    return rec
        except Exception as e:
            logger.warning(f"Failed to fetch material {mid} from Materials Project API: {e}")
            return None
        return None

    def search_by_formula(self, formula: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Queries Materials Project for materials matching a chemical formula.
        """
        if not self.is_configured():
            return []

        try:
            from mp_api.client import MPRester
            logger.info(f"Searching Materials Project API for formula {formula}...")
            with MPRester(api_key=self.api_key) as mpr:
                # Query summary docs
                docs = mpr.materials.summary.search(formula=formula, num_chunks=1, chunk_size=limit)
                results = []
                for doc in docs[:limit]:
                    mid = str(doc.material_id)
                    lat = getattr(doc.structure, "lattice", None) if hasattr(doc, "structure") and doc.structure else None
                    rec = {
                        "material_id": mid,
                        "formula": str(doc.formula_pretty),
                        "crystal_system": str(doc.symmetry.crystal_system.value) if hasattr(doc.symmetry, "crystal_system") else "Unknown",
                        "space_group": str(doc.symmetry.symbol) if hasattr(doc.symmetry, "symbol") else "Unknown",
                        "space_group_number": int(doc.symmetry.number) if hasattr(doc.symmetry, "number") else 0,
                        "energy_above_hull_eV_atom": round(float(doc.energy_above_hull), 4) if doc.energy_above_hull is not None else 0.0,
                        "is_stable": bool(doc.is_stable) if doc.is_stable is not None else False,
                        "band_gap_eV": round(float(doc.band_gap), 3) if doc.band_gap is not None else 0.0,
                        "density_g_cm3": round(float(doc.density), 3) if doc.density is not None else 0.0,
                        "volume_A3": round(float(doc.volume), 3) if doc.volume is not None else 0.0,
                        "formation_energy_eV_atom": round(float(doc.formation_energy_per_atom), 4) if hasattr(doc, "formation_energy_per_atom") and doc.formation_energy_per_atom is not None else None,
                        "source": "Materials Project API (Online)",
                        "lattice_a_A": round(float(lat.a), 4) if lat else 5.0,
                        "lattice_b_A": round(float(lat.b), 4) if lat else 5.0,
                        "lattice_c_A": round(float(lat.c), 4) if lat else 5.0,
                        "alpha_degree": round(float(lat.alpha), 2) if lat else 90.0,
                        "beta_degree": round(float(lat.beta), 2) if lat else 90.0,
                        "gamma_degree": round(float(lat.gamma), 2) if lat else 90.0,
                    }
                    local_cif_path = self.cif_dir / f"{mid}.cif"
                    if not local_cif_path.exists() and hasattr(doc, "structure") and doc.structure:
                        try:
                            cif_str = doc.structure.to(fmt="cif")
                            with open(local_cif_path, "w", encoding="utf-8") as f:
                                f.write(cif_str)
                        except Exception:
                            pass
                    results.append(rec)
                return results
        except Exception as e:
            logger.warning(f"Materials Project API search failed for {formula}: {e}")
            return []

materials_project_service = MaterialsProjectService()
