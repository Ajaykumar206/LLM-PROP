from fastapi import APIRouter
from backend.utils.config import settings
from backend.services.materials_project_service import materials_project_service
from backend.services.openai_service import openai_service
from backend.services.material_search_service import material_search_service
from backend.models.model_loader import model_loader
from backend.models.t5_predictor import t5_predictor
from backend.schemas.material_schema import HealthStatus

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthStatus)
def get_health() -> HealthStatus:
    total_mats = len(material_search_service.df) if material_search_service.df is not None else 0
    has_t5 = model_loader.has_trained_weights()
    metrics = model_loader.load_evaluation_metrics()

    mp_ok = materials_project_service.is_configured()
    openai_ok = openai_service.is_configured()

    return HealthStatus(
        status="healthy",
        version=settings.VERSION,
        database={
            "loaded": total_mats > 0,
            "total_materials": total_mats,
            "robocrys_descriptions_loaded": total_mats
        },
        services={
            "materials_project_api": {
                "configured": mp_ok,
                "status": "connected" if mp_ok else "unconfigured (using local dataset)"
            },
            "gemini_api": {
                "configured": bool(settings.GEMINI_API_KEY),
                "model": "gemini-1.5-flash",
                "status": "connected" if bool(settings.GEMINI_API_KEY) else "unconfigured"
            },
            "openai_api": {
                "configured": openai_ok,
                "model": settings.get_llm_config().get("model", "gpt-4o-mini"),
                "status": "connected" if openai_ok else "unconfigured"
            }
        },
        models={
            "t5_materials_predictor": {
                "loaded": t5_predictor.is_loaded,
                "model_type": "T5 Sequence-to-Sequence",
                "checkpoint_available": has_t5,
                "metrics": metrics.get("metrics", {})
            }
        }
    )
