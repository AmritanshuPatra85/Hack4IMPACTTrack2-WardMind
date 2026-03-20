import json
from datetime import datetime
from typing import List

import httpx
from fastapi import APIRouter


from app.models.schemas import SolarLiveResponse

router = APIRouter()

LAT = 20.2961
LON = 85.8245


async def _cache_set(key: str, payload: dict, ttl: int = 900):
    try:

        await redis.setex(key, ttl, json.dumps(payload))
    except Exception:
        return


async def _cache_get(key: str):
    try:

        cached = await redis.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        return None
    return None


@router.get("/solar/live", response_model=SolarLiveResponse)
async def solar_live():
    cache_key = "gridmind:solar:live"
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LAT,
        "longitude": LON,
        "hourly": "shortwave_radiation,cloudcover,temperature_2m",
        "forecast_days": 1,
        "timezone": "Asia/Kolkata",
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        hourly = data.get("hourly", {})
        radiation = hourly.get("shortwave_radiation", [])
        cloudcover = hourly.get("cloudcover", [])
        temperature = hourly.get("temperature_2m", [])

        if not radiation:
            raise ValueError("Missing radiation data")

        ghi_now = float(radiation[0])
        ghi_forecast_24h = [float(x) for x in radiation[:24]]
        cloud_val = float(cloudcover[0]) if cloudcover else 0.0
        temp_val = float(temperature[0]) if temperature else 0.0

        payload = {
            "ghi_now": ghi_now,
            "ghi_forecast_24h": ghi_forecast_24h,
            "cloud_cover": cloud_val,
            "temperature": temp_val,
            "source": "Open-Meteo (live)",
        }
        await _cache_set(cache_key, payload)
        return payload
    except Exception:
        cached = await _cache_get(cache_key)
        if cached:
            cached["source"] = "Redis cache"
            return cached

    fallback = {
        "ghi_now": 5.2,
        "ghi_forecast_24h": [5.2] * 24,
        "cloud_cover": 0.0,
        "temperature": 30.0,
        "source": "Fallback (static)",
    }
    return fallback
