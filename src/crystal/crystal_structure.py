import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from src.utils.config import settings
from src.utils.logging_config import logger

class CrystalStructureHandler:
    """
    Parses Crystallographic Information Files (CIF) and extracts lattice parameters and atomic sites.
    If a structure CIF is missing locally, fetches it automatically using the Materials Project API Key.
    """
    def __init__(self):
        self.mp_api_key = settings.MP_API_KEY
        self.cif_dir = settings.STRUCTURES_CIF_DIR
        self.cif_dir.mkdir(parents=True, exist_ok=True)

    def get_or_fetch_structure(self, identifier: str) -> Dict[str, Any]:
        """
        Gets crystal structure from local CIF cache; if not found, queries Materials Project API.
        `identifier` can be a material_id (e.g. 'mp-149') or a path to a CIF file.
        """
        # If identifier is a path that exists
        p = Path(identifier)
        if p.exists() and p.is_file():
            return self.parse_cif_file(p)

        # Check local CIF directory
        mid = identifier.replace(".cif", "").strip()
        local_cif = self.cif_dir / f"{mid}.cif"
        if local_cif.exists():
            return self.parse_cif_file(local_cif)

        # If not present locally, fetch from Materials Project API
        logger.info(f"Structure for '{mid}' not found locally. Fetching via Materials Project API...")
        fetched_cif = self.fetch_cif_from_mp(mid)
        if fetched_cif:
            try:
                with open(local_cif, "w", encoding="utf-8") as f:
                    f.write(fetched_cif)
                logger.info(f"Successfully downloaded and saved {local_cif.name} to {self.cif_dir}")
                return self.parse_cif_text(fetched_cif)
            except Exception as e:
                logger.warning(f"Error saving CIF to disk: {e}")
                return self.parse_cif_text(fetched_cif)

        # Fallback default lattice if not found anywhere
        logger.warning(f"Could not retrieve crystal structure for '{identifier}'. Using standard default lattice.")
        return self._default_lattice(mid)

    def fetch_cif_from_mp(self, material_id: str) -> Optional[str]:
        """
        Fetches CIF structure string from Materials Project API using MPRester.
        """
        api_key = self.mp_api_key or os.environ.get("MP_API_KEY", "")
        if not api_key:
            logger.error("MP_API_KEY is not set. Cannot fetch missing structure.")
            return None

        # Clean material id (e.g., mp-149)
        mid = material_id.strip()
        if not mid.startswith("mp-") and not mid.startswith("mvc-"):
            # If formula was passed, try looking up MP ID from database or search
            mid = f"mp-{mid}"

        try:
            from mp_api.client import MPRester
            with MPRester(api_key=api_key) as mpr:
                structure = mpr.get_structure_by_material_id(mid)
                cif_str = structure.to(fmt="cif")
                return cif_str
        except Exception as e:
            logger.warning(f"Materials Project API fetch failed for {mid}: {e}")
            return None

    def parse_cif_file(self, cif_path: Path) -> Dict[str, Any]:
        cif_path = Path(cif_path)
        if not cif_path.exists():
            return self.get_or_fetch_structure(cif_path.stem)

        with open(cif_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        parsed = self.parse_cif_text(content)
        parsed["file_path"] = str(cif_path)
        return parsed

    @staticmethod
    def parse_cif_text(content: str) -> Dict[str, Any]:
        def get_val(tag: str, default: float = 0.0) -> float:
            m = re.search(rf"{tag}\s+([+-]?\d+(?:\.\d+)?)", content)
            if m:
                try:
                    return float(m.group(1))
                except ValueError:
                    pass
            return default

        def get_str(tag: str, default: str = "") -> str:
            m = re.search(rf"{tag}\s+['\"]?([^'\"\r\n]+)['\"]?", content)
            return m.group(1).strip() if m else default

        a = get_val("_cell_length_a", 5.0)
        b = get_val("_cell_length_b", 5.0)
        c = get_val("_cell_length_c", 5.0)
        alpha = get_val("_cell_angle_alpha", 90.0)
        beta = get_val("_cell_angle_beta", 90.0)
        gamma = get_val("_cell_angle_gamma", 90.0)
        volume = get_val("_cell_volume", a * b * c)

        space_group = get_str("_symmetry_space_group_name_H-M") or get_str("_space_group_name_H-M_alt") or "P1"

        # Extract atoms if present
        atoms = []
        atom_lines = re.findall(r"([A-Z][a-z]?)\s+([+-]?\d+\.\d+)\s+([+-]?\d+\.\d+)\s+([+-]?\d+\.\d+)", content)
        for el, x, y, z in atom_lines:
            atoms.append({
                "element": el,
                "x": float(x),
                "y": float(y),
                "z": float(z)
            })

        return {
            "lattice": {
                "a": round(a, 4),
                "b": round(b, 4),
                "c": round(c, 4),
                "alpha": round(alpha, 2),
                "beta": round(beta, 2),
                "gamma": round(gamma, 2),
                "volume": round(volume, 2)
            },
            "space_group": space_group,
            "atom_count": len(atoms),
            "atoms": atoms[:100],
            "raw_cif": content[:4000]
        }

    @staticmethod
    def _default_lattice(identifier: str) -> Dict[str, Any]:
        return {
            "lattice": {
                "a": 5.43,
                "b": 5.43,
                "c": 5.43,
                "alpha": 90.0,
                "beta": 90.0,
                "gamma": 90.0,
                "volume": 160.1
            },
            "space_group": "Fd-3m",
            "atom_count": 8,
            "atoms": [],
            "source": f"Default synthesized structure for {identifier}"
        }

crystal_handler = CrystalStructureHandler()
