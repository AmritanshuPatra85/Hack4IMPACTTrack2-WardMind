from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.db import init_db, check_db_connection
from app.routers import wards, forecast, comparison, interventions, telemetry, export, health, solar

app = FastAPI(title="GridMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": str(exc), "detail": "Internal server error"})

@app.on_event("startup")
def startup_event():
    print("Starting GridMind API...")
    init_db()
    print("GridMind API ready")

app.include_router(wards.router,         prefix="/api", tags=["wards"])
app.include_router(forecast.router,      prefix="/api", tags=["forecast"])
app.include_router(comparison.router,    prefix="/api", tags=["comparison"])
app.include_router(interventions.router, prefix="/api", tags=["interventions"])
app.include_router(telemetry.router,     prefix="/api", tags=["telemetry"])
app.include_router(export.router,        prefix="/api", tags=["export"])
app.include_router(health.router,        prefix="/api", tags=["health"])
app.include_router(solar.router,         prefix="/api", tags=["solar"])

@app.get("/")
def root():
    db_status = "ok" if check_db_connection() else "error"
    return {"status": "GridMind API running", "database": db_status, "docs": "/docs", "version": "1.0.0-hackathon"}