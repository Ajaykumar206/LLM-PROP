import re
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from backend.utils.config import settings
from backend.utils.logging_config import logger
from backend.schemas.material_schema import (
    CrystalStructure3D,
    LatticeInfo,
    AtomSite,
    BondInfo
)

# CPK Elemental Colors & Approximate Covalent Radii (in Angstroms)
ELEMENT_DATA: Dict[str, Tuple[str, float]] = {
    "H": ("#ffffff", 0.31), "He": ("#d9ffff", 0.28),
    "Li": ("#cc80ff", 1.28), "Be": ("#c2ff00", 0.96), "B": ("#ffb5b5", 0.84), "C": ("#333333", 0.76),
    "N": ("#3050f8", 0.71), "O": ("#ff0d0d", 0.66), "F": ("#90e050", 0.57), "Ne": ("#b3e3f5", 0.58),
    "Na": ("#ab5cf2", 1.66), "Mg": ("#8aff00", 1.41), "Al": ("#bfa6a6", 1.21), "Si": ("#f0c8a0", 1.11),
    "P": ("#ff8000", 1.07), "S": ("#ffff30", 1.05), "Cl": ("#1ff01f", 1.02), "Ar": ("#80d1e3", 1.06),
    "K": ("#8f40d4", 2.03), "Ca": ("#3dff00", 1.76), "Sc": ("#e6e6e6", 1.70), "Ti": ("#bfc2c7", 1.60),
    "V": ("#a6a6ab", 1.53), "Cr": ("#8a99c7", 1.39), "Mn": ("#9c7ac7", 1.39), "Fe": ("#e06633", 1.32),
    "Co": ("#f090a0", 1.26), "Ni": ("#50d050", 1.24), "Cu": ("#c88033", 1.32), "Zn": ("#7d80b0", 1.22),
    "Ga": ("#c28f8f", 1.22), "Ge": ("#668f8f", 1.20), "As": ("#bd80e3", 1.19), "Se": ("#ffa100", 1.20),
    "Br": ("#a62929", 1.20), "Kr": ("#5cb8d1", 1.16), "Rb": ("#702eb0", 2.20), "Sr": ("#00ff00", 1.95),
    "Y": ("#94ffff", 1.90), "Zr": ("#94e0e0", 1.75), "Nb": ("#73c2c9", 1.64), "Mo": ("#54b5b5", 1.54),
    "Tc": ("#3b9e9e", 1.47), "Ru": ("#248f8f", 1.46), "Rh": ("#0a7d8c", 1.42), "Pd": ("#006985", 1.39),
    "Ag": ("#c0c0c0", 1.45), "Cd": ("#ffd98f", 1.44), "In": ("#a67573", 1.42), "Sn": ("#668080", 1.39),
    "Sb": ("#9e63b5", 1.39), "Te": ("#d47a00", 1.38), "I": ("#940094", 1.39), "Xe": ("#429eb0", 1.40),
    "Cs": ("#57178f", 2.44), "Ba": ("#00c900", 2.15), "La": ("#70d4ff", 2.07), "Ce": ("#ffffc7", 2.04),
    "Pr": ("#d9ffc7", 2.03), "Nd": ("#c7ffc7", 2.01), "Pm": ("#a3ffc7", 1.99), "Sm": ("#8fffc7", 1.98),
    "Eu": ("#61ffc7", 1.98), "Gd": ("#45ffc7", 1.96), "Tb": ("#30ffc7", 1.94), "Dy": ("#1fffc7", 1.92),
    "Ho": ("#00ff9c", 1.92), "Er": ("#00e675", 1.89), "Tm": ("#00d452", 1.90), "Yb": ("#00bf38", 1.87),
    "Lu": ("#00ab24", 1.87), "Hf": ("#4dc2ff", 1.75), "Ta": ("#4da6ff", 1.70), "W": ("#2194d6", 1.62),
    "Re": ("#267dab", 1.51), "Os": ("#266696", 1.44), "Ir": ("#175487", 1.41), "Pt": ("#d0d0e0", 1.36),
    "Au": ("#ffd123", 1.36), "Hg": ("#b8b8d0", 1.32), "Tl": ("#a6544d", 1.45), "Pb": ("#575961", 1.46),
    "Bi": ("#9e4fb5", 1.48), "Th": ("#00baff", 1.79), "U": ("#008fff", 1.70)
}

class CrystalStructureService:
    """
    Parses and processes CIF crystal structures into 3D renderable data
    including Cartesian coordinates, bond networks, and unit-cell boundaries.
    """

    @classmethod
    def get_element_style(cls, element: str) -> Tuple[str, float]:
        clean = re.sub(r"[^A-Za-z]", "", element).capitalize()
        if clean in ELEMENT_DATA:
            return ELEMENT_DATA[clean]
        return ("#64748b", 1.2)

    @classmethod
    def process_cif(cls, cif_content: str, material_id: str, formula: str) -> CrystalStructure3D:
        """
        Main parser for CIF string into structured CrystalStructure3D model.
        """
        try:
            from pymatgen.core import Structure
            struct = Structure.from_str(cif_content, fmt="cif")
            return cls._from_pymatgen_structure(struct, material_id, formula)
        except Exception as e:
            logger.warning(f"Pymatgen CIF parsing error for {material_id}: {e}. Falling back to custom parser.")
            return cls._custom_cif_parser(cif_content, material_id, formula)

    @classmethod
    def _from_pymatgen_structure(cls, struct, material_id: str, formula: str) -> CrystalStructure3D:
        lattice = struct.lattice
        matrix = lattice.matrix.tolist()

        lattice_info = LatticeInfo(
            a=round(float(lattice.a), 4),
            b=round(float(lattice.b), 4),
            c=round(float(lattice.c), 4),
            alpha=round(float(lattice.alpha), 2),
            beta=round(float(lattice.beta), 2),
            gamma=round(float(lattice.gamma), 2),
            volume=round(float(lattice.volume), 3),
            matrix=matrix
        )

        sites: List[AtomSite] = []
        elements_set = set()

        # Shift center of mass to origin for better 3D camera centering
        cart_coords = np.array([site.coords for site in struct])
        center = cart_coords.mean(axis=0) if len(cart_coords) > 0 else np.zeros(3)

        for i, site in enumerate(struct):
            elem = str(site.specie.symbol)
            elements_set.add(elem)
            color, radius = cls.get_element_style(elem)

            centered_coords = (site.coords - center).tolist()
            frac_coords = site.frac_coords.tolist()

            sites.append(AtomSite(
                element=elem,
                coords=[round(c, 4) for c in centered_coords],
                color=color,
                radius=round(radius * 0.45, 3), # Scale for 3D sphere view
                index=i,
                label=f"{elem}{i+1}",
                fractional_coords=[round(f, 4) for f in frac_coords]
            ))

        # Compute bonds between nearby sites
        bonds = cls._calculate_bonds(sites, struct)

        # Build 12 wireframe edge lines of the unit-cell box
        unit_cell_box = cls._compute_unit_cell_edges(np.array(matrix), center)

        return CrystalStructure3D(
            material_id=material_id,
            formula=formula,
            lattice=lattice_info,
            sites=sites,
            bonds=bonds,
            elements=sorted(list(elements_set)),
            unit_cell_box=unit_cell_box
        )

    @classmethod
    def _calculate_bonds(cls, sites: List[AtomSite], struct=None) -> List[BondInfo]:
        bonds: List[BondInfo] = []
        n = len(sites)
        if n == 0 or n > 250:
            # Avoid O(N^2) lag on massive supercells
            return bonds

        coords = np.array([s.coords for s in sites])

        # Pairwise distance calculation
        for i in range(n):
            elem1 = sites[i].element
            r1 = ELEMENT_DATA.get(elem1, ("#64748b", 1.2))[1]

            for j in range(i + 1, n):
                elem2 = sites[j].element
                r2 = ELEMENT_DATA.get(elem2, ("#64748b", 1.2))[1]

                dist = float(np.linalg.norm(coords[i] - coords[j]))
                max_bond = (r1 + r2) * 1.25

                # Valid chemical bond distance
                if 0.5 < dist <= max_bond:
                    bonds.append(BondInfo(
                        site1_idx=i,
                        site2_idx=j,
                        length_angstrom=round(dist, 3),
                        color="#cbd5e1"
                    ))

        return bonds

    @classmethod
    def _compute_unit_cell_edges(cls, matrix: np.ndarray, center: np.ndarray) -> List[List[List[float]]]:
        """
        Computes 12 line segments forming the 3D parallelepiped box of the crystal lattice.
        """
        va = matrix[0]
        vb = matrix[1]
        vc = matrix[2]

        p000 = -center
        p100 = p000 + va
        p010 = p000 + vb
        p001 = p000 + vc
        p110 = p000 + va + vb
        p101 = p000 + va + vc
        p011 = p000 + vb + vc
        p111 = p000 + va + vb + vc

        edges = [
            # Bottom 4 edges
            [p000.tolist(), p100.tolist()],
            [p100.tolist(), p110.tolist()],
            [p110.tolist(), p010.tolist()],
            [p010.tolist(), p000.tolist()],
            # Top 4 edges
            [p001.tolist(), p101.tolist()],
            [p101.tolist(), p111.tolist()],
            [p111.tolist(), p011.tolist()],
            [p011.tolist(), p001.tolist()],
            # 4 Vertical edges
            [p000.tolist(), p001.tolist()],
            [p100.tolist(), p101.tolist()],
            [p110.tolist(), p111.tolist()],
            [p010.tolist(), p011.tolist()]
        ]
        return [[[round(coord, 4) for coord in pt] for pt in edge] for edge in edges]

    @classmethod
    def _custom_cif_parser(cls, content: str, material_id: str, formula: str) -> CrystalStructure3D:
        """
        Fallback parser when pymatgen is unavailable or structure is unconventional.
        """
        def get_val(tag: str, default: float) -> float:
            m = re.search(rf"{tag}\s+([+-]?\d+(?:\.\d+)?)", content)
            return float(m.group(1)) if m else default

        a = get_val("_cell_length_a", 5.0)
        b = get_val("_cell_length_b", 5.0)
        c = get_val("_cell_length_c", 5.0)
        alpha = get_val("_cell_angle_alpha", 90.0)
        beta = get_val("_cell_angle_beta", 90.0)
        gamma = get_val("_cell_angle_gamma", 90.0)

        volume = a * b * c

        matrix = [
            [a, 0.0, 0.0],
            [0.0, b, 0.0],
            [0.0, 0.0, c]
        ]

        # Extract atoms from loop_ _atom_site_
        sites: List[AtomSite] = []
        atom_lines = re.findall(r"([A-Z][a-z]?)\s+([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)", content)

        elements_set = set()
        for i, match in enumerate(atom_lines):
            elem = match[0]
            elements_set.add(elem)
            fx, fy, fz = float(match[1]), float(match[2]), float(match[3])
            # Fractional to orthogonal
            cx = fx * a - a/2
            cy = fy * b - b/2
            cz = fz * c - c/2
            color, radius = cls.get_element_style(elem)

            sites.append(AtomSite(
                element=elem,
                coords=[round(cx, 4), round(cy, 4), round(cz, 4)],
                color=color,
                radius=round(radius * 0.45, 3),
                index=i,
                label=f"{elem}{i+1}",
                fractional_coords=[round(fx, 4), round(fy, 4), round(fz, 4)]
            ))

        bonds = cls._calculate_bonds(sites)
        box = cls._compute_unit_cell_edges(np.array(matrix), np.array([a/2, b/2, c/2]))

        return CrystalStructure3D(
            material_id=material_id,
            formula=formula,
            lattice=LatticeInfo(a=a, b=b, c=c, alpha=alpha, beta=beta, gamma=gamma, volume=volume, matrix=matrix),
            sites=sites,
            bonds=bonds,
            elements=sorted(list(elements_set)),
            unit_cell_box=box
        )

crystal_structure_service = CrystalStructureService()
