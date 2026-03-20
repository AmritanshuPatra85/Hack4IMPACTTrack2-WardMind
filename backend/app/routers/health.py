from fastapi import APIRouter
from datetime import datetime
from app.db import check_db_connection
from app.config import settings
import httpx

router = APIRouter()

@router.get("/health")
def health_check():
    db_status = "ok" if check_db_connection() else "error"

    redis_status = "ok"

    try:
        response = httpx.get(
            f"{settings.ML_SERVICE_URL}/health",
            timeout=2
        )
        ml_status = "ok" if response.status_code == 200 else "offline"
    except Exception:
        ml_status = "offline"

    return {
        "database": db_status,
        "redis": redis_status,
        "ml_service": ml_status,
        "last_data_refresh": datetime.utcnow().isoformat(),
        "version": "1.0.0-hackathon"
    }