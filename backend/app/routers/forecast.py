import math
from typing import List

from fastapi import APIRouter

from app.models.schemas import CityForecastResponse

router = APIRouter()


def _logistic(years: List[int], L: float, k: float, x0: float) -> List[float]:
    values = []
    for year in years:
        val = L / (1 + math.exp(-k * (year - x0)))
        values.append(round(val, 2))
    return values


@router.get("/forecast/city", response_model=CityForecastResponse)
async def city_forecast():
    years = list(range(2025, 2036))
    optimal = _logistic(years, L=95, k=0.6, x0=2029)
    current = _logistic(years, L=78, k=0.4, x0=2031)
    bau = _logistic(years, L=62, k=0.3, x0=2032)
    return {"years": years, "optimal": optimal, "current": current, "bau": bau}
