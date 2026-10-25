import pytest
from backend.services.property_prediction_service import property_prediction_service
from backend.schemas.prediction_schema import PredictionRequest

def test_prediction_request():
    req = PredictionRequest(formula="SiO2", crystal_system="Trigonal", space_group="P3221")
    res = property_prediction_service.predict(req)
    assert res.status == "success"
    assert "band_gap" in res.predictions
    assert "formation_energy" in res.predictions
    assert "density" in res.predictions

    bg = res.predictions["band_gap"]
    assert bg.unit == "eV"
    assert bg.predicted_value >= 0.0

    fe = res.predictions["formation_energy"]
    assert fe.unit == "eV/atom"

    dens = res.predictions["density"]
    assert dens.unit == "g/cm³"
    assert dens.predicted_value > 0.0

def test_prediction_with_unknown_crystal_system():
    req = PredictionRequest(formula="GaAs")
    res = property_prediction_service.predict(req)
    assert res.status == "success"
    assert res.normalized_formula == "GaAs"
