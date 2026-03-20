import json
import math
from datetime import datetime, timedelta
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import Ward, get_db
from app.models.schemas import ForecastResponse, TelemetryResponse, WardResponse, WardShapResponse
from app.services.mock_data import get_mock_ward_by_id, get_mock_wards

router = APIRouter()


def _orm_to_dict(obj) -> dict:
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}


def _filter_and_sort(wards: List[dict], q: Optional[str], layer: Optional[str]) -> List[dict]:
    filtered = wards
    if q:
        q_lower = q.lower()
        filtered = [ward for ward in filtered if q_lower in ward["name"].lower()]
        if not filtered:
            filtered = wards

    sort_key = None
    if layer == "epi":
        sort_key = "epi_score"
    elif layer == "solar":
        sort_key = "solar_ghi"
    elif layer == "outage":
        sort_key = "outage_hours"
    elif layer == "income":
        sort_key = "income_decile"

    if sort_key:
        filtered = sorted(filtered, key=lambda w: w.get(sort_key, 0), reverse=True)

    return filtered


def _mock_shap(ward_id: int) -> dict:
    ward = get_mock_ward_by_id(ward_id)
    features = [
        {
            "name": "outage_hours",
            "value": ward["outage_hours"],
            "impact": round(ward["outage_hours"] / 10, 3),
        },
        {
            "name": "income_decile",
            "value": ward["income_decile"],
            "impact": round((10 - ward["income_decile"]) / 12, 3),
        },
        {
            "name": "solar_ghi",
            "value": ward["solar_ghi"],
            "impact": round(ward["solar_ghi"] / 10, 3),
        },
        {
            "name": "burden_pct",
            "value": ward["burden_pct"],
            "impact": round(ward["burden_pct"] / 20, 3),
        },
    ]
    base_value = 0.5
    prediction = round(base_value + sum(f["impact"] for f in features) / 4.5, 3)
    return {
        "ward_id": ward_id,
        "base_value": base_value,
        "prediction": min(prediction, 0.99),
        "features": features,
    }


def _mock_telemetry(ward_id: int) -> dict:
    ward = get_mock_ward_by_id(ward_id)
    now = datetime.utcnow()
    return {
        "ward_id": ward_id,
        "timestamp": now.isoformat(),
        "outage_hrs": round(ward["outage_hours"] * 0.9, 2),
        "peak_load_mw": round(12 + ward["outage_hours"] * 0.8, 2),
        "voltage_sags": round(ward["outage_hours"] * 1.2, 2),
        "solar_ghi": ward["solar_ghi"],
        "grid_freq": round(49.8 + ward["income_decile"] / 100, 2),
        "dt_failures": int(max(1, ward["outage_hours"] // 2)),
    }


def _mock_forecast(ward_id: int) -> dict:
    ward = get_mock_ward_by_id(ward_id)
    base = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    intervals = []
    for i in range(48):
        ts = base + timedelta(hours=i)
        hour = ts.hour
        solar_factor = max(0.0, math.sin((hour - 6) / 12 * math.pi))
        solar_ghi = round(ward["solar_ghi"] * solar_factor, 2)
        outage_hrs = round(max(0.1, ward["outage_hours"] * (0.6 + 0.4 * math.cos(i / 8))), 2)
        demand_mw = round(10 + ward["burden_pct"] / 2 + (1 - solar_factor) * 3, 2)
        intervals.append(
            {
                "timestamp": ts.isoformat(),
                "outage_hrs": outage_hrs,
                "solar_ghi": solar_ghi,
                "demand_mw": demand_mw,
            }
        )
    return {"ward_id": ward_id, "intervals": intervals}


async def _get_cached_json(key: str):
    try:
        redis = await get_redis()
        cached = await redis.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        return None
    return None


async def _set_cached_json(key: str, value: dict, ttl_seconds: int):
    try:
        redis = await get_redis()
        await redis.setex(key, ttl_seconds, json.dumps(value))
    except Exception:
        return


async def _fetch_shap(ward_id: int) -> dict:
    cache_key = f"gridmind:shap:{ward_id}"
    cached = await _get_cached_json(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ML_SERVICE_URL}/ml/shap/{ward_id}")
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        data = _mock_shap(ward_id)

    await _set_cached_json(cache_key, data, 3600)
    return data


async def _fetch_telemetry(ward_id: int) -> dict:
    cache_key = f"gridmind:telemetry:{ward_id}"
    cached = await _get_cached_json(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ML_SERVICE_URL}/ml/telemetry/{ward_id}")
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        data = _mock_telemetry(ward_id)

    await _set_cached_json(cache_key, data, 300)
    return data


async def _fetch_forecast(ward_id: int) -> dict:
    cache_key = f"gridmind:forecast:{ward_id}"
    cached = await _get_cached_json(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ML_SERVICE_URL}/ml/forecast/{ward_id}")
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        data = _mock_forecast(ward_id)

    await _set_cached_json(cache_key, data, 900)
    return data


@router.get("/wards", response_model=List[WardResponse])
async def list_wards(
    q: Optional[str] = Query(default=None),
    layer: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    wards = []
    try:
        stmt = select(Ward)
        if q:
            stmt = stmt.where(Ward.name.ilike(f"%{q}%"))
        result = db.execute(stmt)
        wards = [_orm_to_dict(row) for row in result.scalars().all()]
    except Exception:
        wards = []

    if not wards:
        wards = get_mock_wards()

    wards = _filter_and_sort(wards, q, layer)
    return wards


@router.get("/wards/{ward_id}", response_model=WardResponse)
async def get_ward(ward_id: int, db: Session = Depends(get_db)):
    ward = None
    try:
        result = db.execute(select(Ward).where(Ward.id == ward_id))
        ward_obj = result.scalars().first()
        if ward_obj:
            ward = _orm_to_dict(ward_obj)
    except Exception:
        ward = None

    if not ward:
        ward = get_mock_ward_by_id(ward_id)

    return ward


@router.get("/wards/{ward_id}/shap", response_model=WardShapResponse)
async def get_ward_shap(ward_id: int):
    data = await _fetch_shap(ward_id)
    return data


@router.get("/wards/{ward_id}/telemetry", response_model=TelemetryResponse)
async def get_ward_telemetry(ward_id: int):
    data = await _fetch_telemetry(ward_id)
    return data


@router.get("/wards/{ward_id}/forecast", response_model=ForecastResponse)
async def get_ward_forecast(ward_id: int):
    data = await _fetch_forecast(ward_id)
    return data

