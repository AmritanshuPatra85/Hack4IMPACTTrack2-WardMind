from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import City, get_db
from app.models.schemas import CityResponse
from app.services.mock_data import CITY_SEED

router = APIRouter()


def _orm_to_dict(obj) -> dict:
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}


@router.get("/cities", response_model=List[CityResponse])
async def list_cities(db: Session = Depends(get_db)):
    cities = []
    try:
        result = db.execute(select(City))
        cities = [_orm_to_dict(row) for row in result.scalars().all()]
    except Exception:
        cities = []

    if not cities:
        cities = CITY_SEED

    return cities

