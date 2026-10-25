import pytest
from backend.utils.validators import formula_validator
from backend.services.material_search_service import material_search_service

def test_formula_normalization():
    assert formula_validator.normalize_input("sio2") == "SiO2"
    assert formula_validator.normalize_input("gaas") == "GaAs"
    assert formula_validator.normalize_input("tio2") == "TiO2"
    assert formula_validator.normalize_input("al2o3") == "Al2O3"
    assert formula_validator.normalize_input("graphene") == "C"
    assert formula_validator.normalize_input("silicon") == "Si"

def test_formula_validation():
    assert formula_validator.is_valid_formula("SiO2") is True
    assert formula_validator.is_valid_formula("GaAs") is True
    assert formula_validator.is_valid_formula("CaMg(CO3)2") is True
    assert formula_validator.is_valid_formula("") is False
    assert formula_validator.is_valid_formula("XyZ123NotAnElement") is False

def test_search_known_material():
    res = material_search_service.search("SiO2")
    assert res.count > 0
    assert res.selected_material is not None
    assert "Si" in res.selected_material.elements
    assert "O" in res.selected_material.elements
    assert res.selected_material.formula in ["SiO2", "O2Si"]

def test_search_polymorphs():
    res = material_search_service.search("TiO2")
    assert res.count >= 1
    if res.count > 1:
        assert res.requires_polymorph_selection is True
        assert len(res.matches) == res.count

def test_search_nonexistent_material():
    res = material_search_service.search("UnobTanium999")
    assert res.count == 0
    assert res.selected_material is None
    assert "No matching" in res.message
