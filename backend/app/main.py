from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.db import SessionLocal, Base, Ward, City, Intervention, get_db, init_db
from app.routers import (
    comparison,
    export,
    forecast,
    health,
    interventions,
    solar,
    stats,
    telemetry,
    wards,
)
from app.services.mock_data import INTERVENTION_SEED, WARD_SEED

app = FastAPI(title="GridMind API", version="1.0.0-hackathon")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"{request.method} {request.url.path}")
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal Server Error", "detail": str(exc)})


@app.on_event("startup")
def startup_event():
    init_db()


app.include_router(wards.router, prefix="/api", tags=["wards"])
app.include_router(forecast.router, prefix="/api", tags=["forecast"])
app.include_router(comparison.router, prefix="/api", tags=["comparison"])
app.include_router(interventions.router, prefix="/api", tags=["interventions"])
app.include_router(telemetry.router, prefix="/api", tags=["telemetry"])
app.include_router(export.router, prefix="/api", tags=["export"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(solar.router, prefix="/api", tags=["solar"])
app.include_router(stats.router, prefix="/api", tags=["stats"])


@app.get("/")
def root():
    return {"status": "GridMind API running", "docs": "/docs"}
