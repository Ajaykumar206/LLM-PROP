import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "database" in data
    assert "services" in data
    assert "models" in data

def test_search_material_endpoint():
    res = client.get("/api/materials/search?q=SiO2")
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "SiO2"
    assert data["count"] > 0
    assert data["selected_material"] is not None
    assert "properties" in data["selected_material"]

def test_get_material_detail_endpoint():
    # First search to get a valid material_id
    search_res = client.get("/api/materials/search?q=SiO2")
    mat_id = search_res.json()["selected_material"]["material_id"]

    res = client.get(f"/api/materials/{mat_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["material_id"] == mat_id
    assert "lattice" in detail
    assert "properties" in detail

def test_get_structure_endpoint():
    search_res = client.get("/api/materials/search?q=SiO2")
    mat_id = search_res.json()["selected_material"]["material_id"]

    res = client.get(f"/api/materials/{mat_id}/structure")
    assert res.status_code == 200
    struct = res.json()
    assert "sites" in struct
    assert "bonds" in struct
    assert "unit_cell_box" in struct

def test_cif_download_endpoint():
    search_res = client.get("/api/materials/search?q=SiO2")
    mat_id = search_res.json()["selected_material"]["material_id"]

    res = client.get(f"/api/materials/{mat_id}/cif")
    assert res.status_code == 200
    assert "data_" in res.text or "_cell_length" in res.text

def test_predictions_endpoint():
    payload = {
        "formula": "GaAs",
        "crystal_system": "Cubic",
        "space_group": "F-43m"
    }
    res = client.post("/api/predictions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["formula"] == "GaAs"
    assert "band_gap" in data["predictions"]

def test_explanations_endpoint():
    payload = {
        "formula": "SiO2",
        "crystal_system": "Trigonal",
        "space_group": "P3221",
        "properties": {
            "band_gap": {"value": 8.9, "unit": "eV"}
        }
    }
    res = client.post("/api/explanations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["formula"] == "SiO2"
    assert len(data["summary"]) > 0
    assert len(data["potential_applications"]) > 0
