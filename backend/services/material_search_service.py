import os
import re
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.utils.config import settings
from backend.utils.logging_config import logger
from backend.utils.validators import formula_validator
from backend.services.materials_project_service import materials_project_service
from backend.services.crystal_structure_service import crystal_structure_service
from backend.schemas.material_schema import (
    SearchResponse,
    MaterialDetail,
    MaterialSummary,
    PolymorphOption,
    PropertyValue,
    LatticeInfo
)

class MaterialSearchService:
    """
    Orchestrates searching across local 10,000-material dataset and Materials Project API.
    Identifies polymorphs, formats full scientific property tables, and compiles 3D crystal structures.
    """
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self._load_local_database()

    def _load_local_database(self):
        csv_path = settings.PROCESSED_DATA_PATH
        if not csv_path.exists():
            csv_path = settings.RAW_DATA_PATH

        if csv_path.exists():
            try:
                self.df = pd.read_csv(csv_path)
                logger.info(f"Loaded {len(self.df)} materials into MaterialSearchService.")
            except Exception as e:
                logger.warning(f"Could not load local materials CSV: {e}")

    def search(self, raw_query: str) -> SearchResponse:
        """
        Executes end-to-end search workflow for a formula or material identifier.
        """
        query = raw_query.strip()
        if not query:
            return SearchResponse(
                query=query,
                count=0,
                matches=[],
                requires_polymorph_selection=False,
                source="None",
                message="Please enter a chemical formula or material name."
            )

        # 1. Normalize query
        norm_formula = formula_validator.normalize_input(query)

        # 2. Search local dataset first
        local_records = self._search_local(query, norm_formula)

        # 3. If local search returned nothing and MP API is available, query MP API
        mp_records = []
        if not local_records and materials_project_service.is_configured() and formula_validator.is_valid_formula(norm_formula):
            mp_records = materials_project_service.search_by_formula(norm_formula, limit=10)

        all_matches = local_records if local_records else mp_records
        source = "Local Materials Dataset" if local_records else ("Materials Project API" if mp_records else "None")

        if not all_matches:
            return SearchResponse(
                query=query,
                normalized_formula=norm_formula,
                count=0,
                matches=[],
                requires_polymorph_selection=False,
                source=source,
                message=f"No matching crystal structures found for '{query}' (normalized: '{norm_formula}')."
            )

        # Sort matches so the most thermodynamically stable (lowest energy above hull) is first
        all_matches.sort(key=lambda m: (not m.get("is_stable", False), m.get("energy_above_hull_eV_atom", 999.0)))

        # Build list of MaterialSummary
        summary_list: List[MaterialSummary] = [
            MaterialSummary(
                material_id=m["material_id"],
                formula=m["formula"],
                crystal_system=m.get("crystal_system", "Unknown"),
                space_group=m.get("space_group", "Unknown"),
                space_group_number=int(m.get("space_group_number", 0)),
                energy_above_hull_eV_atom=round(float(m.get("energy_above_hull_eV_atom", 0.0)), 4),
                is_stable=bool(m.get("is_stable", False)),
                band_gap_eV=round(float(m.get("band_gap_eV", 0.0)), 3),
                density_g_cm3=round(float(m.get("density_g_cm3", 0.0)), 3)
            )
            for m in all_matches
        ]

        # Detailed representation for the primary/ground-state material
        primary_record = all_matches[0]
        selected_detail = self.get_material_detail(primary_record["material_id"], primary_record, all_matches)

        requires_polymorph_selection = len(all_matches) > 1

        return SearchResponse(
            query=query,
            normalized_formula=norm_formula,
            count=len(all_matches),
            matches=summary_list,
            selected_material=selected_detail,
            requires_polymorph_selection=requires_polymorph_selection,
            source=source,
            message=f"Found {len(all_matches)} structure(s) for '{norm_formula}'."
        )

    def _search_local(self, query: str, norm_formula: str) -> List[Dict[str, Any]]:
        if self.df is None or self.df.empty:
            return []

        q_lower = query.lower()
        norm_lower = norm_formula.lower()

        # Check exact formula match
        matched = self.df[self.df["formula"].astype(str).str.lower() == norm_lower]

        # Check exact material_id
        if matched.empty:
            matched = self.df[self.df["material_id"].astype(str).str.lower() == q_lower]

        # Check substring formula
        if matched.empty and len(query) >= 2:
            matched = self.df[self.df["formula"].astype(str).str.lower().str.contains(f"^{norm_lower}$", regex=True)]

        return matched.to_dict(orient="records")

    def get_material_detail(
        self,
        material_id: str,
        record: Optional[Dict[str, Any]] = None,
        all_polymorph_records: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[MaterialDetail]:
        """
        Builds full MaterialDetail including 3D structure and polymorph choices.
        """
        if record is None:
            # Lookup locally
            if self.df is not None and not self.df.empty:
                m = self.df[self.df["material_id"].astype(str).str.lower() == material_id.lower().strip()]
                if not m.empty:
                    record = m.iloc[0].to_dict()

        if record is None:
            # Fallback: query Materials Project API directly using MP_API_KEY
            if materials_project_service.is_configured():
                record = materials_project_service.get_material_by_id(material_id)

        if record is None:
            return None

        formula = str(record.get("formula", ""))
        mid = str(record.get("material_id", material_id))

        # 1. Other polymorphs
        if all_polymorph_records is None:
            if self.df is not None:
                all_polymorph_records = self.df[self.df["formula"].astype(str).str.lower() == formula.lower()].to_dict(orient="records")
            if not all_polymorph_records and materials_project_service.is_configured() and formula:
                all_polymorph_records = materials_project_service.search_by_formula(formula, limit=10)

        other_polymorphs: List[PolymorphOption] = []
        if all_polymorph_records:
            for p in all_polymorph_records:
                if str(p.get("material_id")) != mid:
                    other_polymorphs.append(PolymorphOption(
                        material_id=str(p.get("material_id")),
                        formula=str(p.get("formula")),
                        crystal_system=str(p.get("crystal_system", "Unknown")),
                        space_group=str(p.get("space_group", "Unknown")),
                        space_group_number=int(p.get("space_group_number", 0)),
                        energy_above_hull_eV_atom=round(float(p.get("energy_above_hull_eV_atom", 0.0)), 4),
                        is_stable=bool(p.get("is_stable", False)),
                        band_gap_eV=round(float(p.get("band_gap_eV", 0.0)), 3),
                        density_g_cm3=round(float(p.get("density_g_cm3", 0.0)), 3),
                        volume_A3=round(float(p.get("volume_A3", 0.0)), 3)
                    ))

        # 2. Lattice parameters
        a = float(record.get("lattice_a_A", 5.0) or 5.0)
        b = float(record.get("lattice_b_A", 5.0) or 5.0)
        c = float(record.get("lattice_c_A", 5.0) or 5.0)
        alpha = float(record.get("alpha_degree", 90.0) or 90.0)
        beta = float(record.get("beta_degree", 90.0) or 90.0)
        gamma = float(record.get("gamma_degree", 90.0) or 90.0)
        vol = float(record.get("volume_A3", a*b*c) or (a*b*c))

        lattice_info = LatticeInfo(
            a=round(a, 4),
            b=round(b, 4),
            c=round(c, 4),
            alpha=round(alpha, 2),
            beta=round(beta, 2),
            gamma=round(gamma, 2),
            volume=round(vol, 3)
        )

        # 3. Load or fetch CIF structure
        cif_content = materials_project_service.get_cif(mid)
        struct_3d = None
        if cif_content:
            struct_3d = crystal_structure_service.process_cif(cif_content, mid, formula)
        else:
            # Build synthetic unit cell with lattice params if CIF is missing
            cif_dummy = f"data_{mid}\n_cell_length_a {a}\n_cell_length_b {b}\n_cell_length_c {c}\n_cell_angle_alpha {alpha}\n_cell_angle_beta {beta}\n_cell_angle_gamma {gamma}\n"
            struct_3d = crystal_structure_service.process_cif(cif_dummy, mid, formula)

        # 4. Compile Property Values with provenance
        properties: Dict[str, PropertyValue] = self._compile_properties(record)

        # 5. Composition and elements
        comp_dict = formula_validator.parse_composition(formula)
        elements = sorted(list(comp_dict.keys()))

        return MaterialDetail(
            material_id=mid,
            formula=formula,
            composition=str(record.get("composition", formula)),
            elements=elements,
            chemical_system=str(record.get("chemical_system", "-".join(elements))),
            crystal_system=str(record.get("crystal_system", "Unknown")),
            space_group=str(record.get("space_group", "Unknown")),
            space_group_number=int(record.get("space_group_number", 0)),
            properties=properties,
            lattice=lattice_info,
            structure_3d=struct_3d,
            polymorphs_count=len(other_polymorphs) + 1,
            other_polymorphs=other_polymorphs,
            source=str(record.get("source", "Materials Project / Local Database"))
        )

    def _compile_properties(self, r: Dict[str, Any]) -> Dict[str, PropertyValue]:
        props: Dict[str, PropertyValue] = {}

        def add_prop(key: str, name: str, val: Any, unit: str, desc: str):
            if val is not None and not (isinstance(val, float) and pd.isna(val)):
                fval = float(val)
                props[key] = PropertyValue(
                    name=name,
                    value=round(fval, 4),
                    formatted_value=f"{fval:.3f} {unit}".strip(),
                    unit=unit,
                    source="Materials Project Ground Truth",
                    is_predicted=False,
                    description=desc
                )
            else:
                props[key] = PropertyValue(
                    name=name,
                    value=None,
                    formatted_value="Not Available",
                    unit=unit,
                    source="Database",
                    is_predicted=False,
                    description=desc
                )

        add_prop("band_gap", "Band Gap", r.get("band_gap_eV"), "eV", "Energy difference between valence band and conduction band minimum.")
        add_prop("formation_energy", "Formation Energy per Atom", r.get("formation_energy_eV_atom"), "eV/atom", "Thermodynamic energy released during synthesis from standard constituent elements.")
        add_prop("energy_above_hull", "Energy Above Hull", r.get("energy_above_hull_eV_atom"), "eV/atom", "Thermodynamic distance from the convex hull; 0 eV/atom indicates ground-state stability.")
        add_prop("density", "Density", r.get("density_g_cm3"), "g/cm³", "Mass per unit volume of the crystalline solid.")
        add_prop("unit_cell_volume", "Unit Cell Volume", r.get("volume_A3"), "Å³", "Volume enclosed by the crystallographic unit cell.")
        add_prop("number_of_sites", "Number of Sites", r.get("number_of_sites"), "atoms", "Total count of atomic positions in the unit cell.")

        # Stability boolean status
        is_stab = r.get("is_stable")
        props["stability_status"] = PropertyValue(
            name="Stability Status",
            value=1.0 if is_stab else 0.0,
            formatted_value="Thermodynamically Stable" if is_stab else "Metastable",
            unit="",
            source="Convex Hull Analysis",
            is_predicted=False,
            description="Whether the material lies on the thermodynamic convex ground-state hull."
        )

        return props

material_search_service = MaterialSearchService()
