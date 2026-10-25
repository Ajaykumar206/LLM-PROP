from fastapi import APIRouter, HTTPException, Query, Response
from backend.services.material_search_service import material_search_service
from backend.services.materials_project_service import materials_project_service
from backend.schemas.material_schema import (
    SearchResponse,
    MaterialDetail,
    CrystalStructure3D
)

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.get("/search", response_model=SearchResponse)
def search_materials(q: str = Query(..., description="Chemical formula or material name, e.g. SiO2, GaAs, TiO2, Graphene")):
    return material_search_service.search(q)

@router.get("/{material_id}", response_model=MaterialDetail)
def get_material_by_id(material_id: str):
    detail = material_search_service.get_material_detail(material_id)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Material with ID '{material_id}' was not found."
        )
    return detail

@router.get("/{material_id}/structure", response_model=CrystalStructure3D)
def get_material_structure(material_id: str):
    detail = material_search_service.get_material_detail(material_id)
    if not detail or not detail.structure_3d:
        raise HTTPException(
            status_code=404,
            detail=f"3D Crystal structure for '{material_id}' could not be resolved."
        )
    return detail.structure_3d

@router.get("/{material_id}/properties")
def get_material_properties(material_id: str):
    detail = material_search_service.get_material_detail(material_id)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Properties for material '{material_id}' could not be resolved."
        )
    return {
        "material_id": detail.material_id,
        "formula": detail.formula,
        "properties": detail.properties
    }

@router.get("/{material_id}/cif")
def download_cif(material_id: str):
    cif_str = materials_project_service.get_cif(material_id)
    if not cif_str:
        # Check if detail exists to construct standard CIF
        detail = material_search_service.get_material_detail(material_id)
        if detail and detail.lattice:
            lat = detail.lattice
            cif_str = (
                f"data_{detail.material_id}\n"
                f"_chemical_formula_sum '{detail.formula}'\n"
                f"_symmetry_cell_setting {detail.crystal_system.lower()}\n"
                f"_symmetry_space_group_name_H-M '{detail.space_group}'\n"
                f"_cell_length_a {lat.a}\n"
                f"_cell_length_b {lat.b}\n"
                f"_cell_length_c {lat.c}\n"
                f"_cell_angle_alpha {lat.alpha}\n"
                f"_cell_angle_beta {lat.beta}\n"
                f"_cell_angle_gamma {lat.gamma}\n"
                f"_cell_volume {lat.volume}\n"
            )
        else:
            raise HTTPException(status_code=404, detail=f"CIF for material '{material_id}' not found.")

    filename = f"{material_id}.cif"
    return Response(
        content=cif_str,
        media_type="chemical/x-cif",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
