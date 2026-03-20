from typing import List

from fastapi import APIRouter

from app.models.schemas import TelemetryResponse
from app.routers import wards as wards_router
from app.services.mock_data import WARD_SEED

router = APIRouter()


@router.get("/telemetry/latest", response_model=List[TelemetryResponse])
async def latest_telemetry():
    return [wards_router._mock_telemetry(ward["id"]) for ward in WARD_SEED]
