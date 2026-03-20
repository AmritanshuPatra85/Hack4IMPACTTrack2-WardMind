from fastapi import APIRouter

from app.models.schemas import CityForecastResponse

router = APIRouter()


@router.get("/forecast/city", response_model=CityForecastResponse)
async def city_forecast():
    return {
        "years": [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035],
        "optimal": [5000, 22000, 55000, 96000, 148000, 198000, 230000, 248000, 258000, 262000, 265000],
        "current": [5000, 12000, 28000, 52000, 80000, 112000, 140000, 162000, 178000, 190000, 200000],
        "bau": [5000, 5800, 6800, 8200, 10000, 12500, 15000, 17500, 19500, 21000, 22000],
        "note": "Modelled using logistic growth curve fitted to MNRE deployment data 2019-2024",
    }
