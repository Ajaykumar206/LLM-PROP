import os
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from backend.utils.config import settings
from backend.utils.logging_config import logger
from backend.api.health_routes import router as health_router
from backend.api.material_routes import router as material_router
from backend.api.prediction_routes import router as prediction_router

app = FastAPI(
    title="LLM-Prop API",
    description="AI-Powered Material Property Prediction and Interactive 3D Crystal Structure Explorer",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration: allows configured origins, local development, and any *.onrender.com service
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(health_router, prefix="/api")
app.include_router(health_router) # Support direct /health requests
app.include_router(material_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Starting LLM-Prop Backend Service")
    logger.info(f"Version: {settings.VERSION}")
    logger.info(f"Base Directory: {settings.BASE_DIR}")
    logger.info(f"Allowed CORS Origins: {settings.CORS_ORIGINS}")
    logger.info("Pre-loading fine-tuned T5 model weights...")
    try:
        from backend.models.t5_predictor import t5_predictor
        t5_predictor.load()
    except Exception as e:
        logger.warning(f"Could not pre-load T5 model: {e}")
    logger.info("=" * 60)

@app.get("/api")
def api_root():
    return {
        "title": "LLM-Prop Backend API",
        "description": "AI-Powered Material Property Prediction and 3D Crystal Explorer",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "endpoints": {
            "health": "/api/health",
            "material_search": "/api/materials/search?q=SiO2",
            "material_detail": "/api/materials/{material_id}",
            "crystal_structure": "/api/materials/{material_id}/structure",
            "predictions": "/api/predictions",
            "explanations": "/api/explanations"
        }
    }

# Production Frontend Static Serving (if built)
frontend_dist = settings.BASE_DIR / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    def serve_root():
        return FileResponse(str(frontend_dist / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Do not capture API routes or documentation
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path == "openapi.json":
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = frontend_dist / full_path
        if target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(frontend_dist / "index.html"))
else:
    @app.get("/")
    def read_root():
        return api_root()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "path": str(request.url.path)}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("backend.main:app", host=settings.HOST, port=port, reload=False)
