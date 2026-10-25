import pytest
from backend.services.crystal_structure_service import crystal_structure_service

SAMPLE_CIF = """
data_SiO2
_cell_length_a 4.9134
_cell_length_b 4.9134
_cell_length_c 5.4052
_cell_angle_alpha 90.00
_cell_angle_beta 90.00
_cell_angle_gamma 120.00
loop_
 _atom_site_type_symbol
 _atom_site_fract_x
 _atom_site_fract_y
 _atom_site_fract_z
 Si 0.4697 0.0000 0.0000
 O  0.4141 0.2681 0.1188
"""

def test_cif_processing():
    struct = crystal_structure_service.process_cif(SAMPLE_CIF, "mp-test-sio2", "SiO2")
    assert struct.material_id == "mp-test-sio2"
    assert struct.formula == "SiO2"
    assert struct.lattice.a == pytest.approx(4.9134, rel=1e-3)
    assert len(struct.sites) >= 2
    assert "Si" in struct.elements
    assert "O" in struct.elements
    assert len(struct.unit_cell_box) == 12

def test_element_style():
    color, radius = crystal_structure_service.get_element_style("Si")
    assert color == "#f0c8a0"
    assert radius > 0

    o_color, o_rad = crystal_structure_service.get_element_style("O")
    assert o_color == "#ff0d0d"
    assert o_rad > 0
