from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

class LatticeInfo(BaseModel):
    a: float
    b: float
    c: float
    alpha: float
    beta: float
    gamma: float
    volume: float
    matrix: Optional[List[List[float]]] = None

class AtomSite(BaseModel):
    element: str
    coords: List[float] = Field(..., description="Cartesian [x, y, z] in Angstroms")
    color: str
    radius: float
    index: int
    label: Optional[str] = None
    fractional_coords: Optional[List[float]] = None

class BondInfo(BaseModel):
    site1_idx: int
    site2_idx: int
    length_angstrom: float
    color: Optional[str] = None

class CrystalStructure3D(BaseModel):
    material_id: str
    formula: str
    lattice: LatticeInfo
    sites: List[AtomSite]
    bonds: List[BondInfo]
    elements: List[str]
    unit_cell_box: List[List[List[float]]]

class PropertyValue(BaseModel):
    name: str
    value: Optional[float] = None
    formatted_value: str
    unit: str
    source: str
    is_predicted: bool
    uncertainty: Optional[str] = None
    description: Optional[str] = None

class PolymorphOption(BaseModel):
    material_id: str
    formula: str
    crystal_system: str
    space_group: str
    space_group_number: int
    energy_above_hull_eV_atom: float
    is_stable: bool
    band_gap_eV: float
    density_g_cm3: float
    volume_A3: float

class MaterialDetail(BaseModel):
    material_id: str
    formula: str
    composition: str
    elements: List[str]
    chemical_system: str
    crystal_system: str
    space_group: str
    space_group_number: int
    properties: Dict[str, PropertyValue]
    lattice: LatticeInfo
    structure_3d: Optional[CrystalStructure3D] = None
    polymorphs_count: int = 1
    other_polymorphs: List[PolymorphOption] = []
    source: str = "Materials Project / Local Database"

class MaterialSummary(BaseModel):
    material_id: str
    formula: str
    crystal_system: str
    space_group: str
    space_group_number: int
    energy_above_hull_eV_atom: float
    is_stable: bool
    band_gap_eV: float
    density_g_cm3: float

class SearchResponse(BaseModel):
    query: str
    normalized_formula: Optional[str] = None
    count: int
    matches: List[MaterialSummary]
    selected_material: Optional[MaterialDetail] = None
    requires_polymorph_selection: bool = False
    source: str
    message: Optional[str] = None

class HealthStatus(BaseModel):
    status: str
    version: str
    database: Dict[str, Any]
    services: Dict[str, Any]
    models: Dict[str, Any]
