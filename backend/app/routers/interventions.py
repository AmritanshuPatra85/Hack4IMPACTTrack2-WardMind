import csv
import io
from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Intervention, get_db
from app.models.schemas import InterventionResponse
from app.services.mock_data import INTERVENTION_SEED

router = APIRouter()


def _orm_to_dict(obj) -> dict:
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}


def _sorted_interventions(data):
    return sorted(data, key=lambda x: x.get("hh_per_lakh", 0), reverse=True)


@router.get("/interventions", response_model=List[InterventionResponse])
async def list_interventions(db: Session = Depends(get_db)):
    interventions = []
    try:
        result = db.execute(select(Intervention))
        interventions = [_orm_to_dict(row) for row in result.scalars().all()]
    except Exception:
        interventions = []

    if not interventions:
        interventions = INTERVENTION_SEED

    interventions = _sorted_interventions(interventions)
    return interventions


@router.get("/interventions/export")
async def export_interventions(db: Session = Depends(get_db)):
    interventions = []
    try:
        result = db.execute(select(Intervention).order_by(Intervention.rank))
        interventions = [_orm_to_dict(row) for row in result.scalars().all()]
    except Exception:
        interventions = []

    if not interventions:
        interventions = sorted(INTERVENTION_SEED, key=lambda x: x.get("rank", 0))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Rank",
            "Intervention",
            "Wards Covered",
            "Households",
            "Cost (Lakh Rs)",
            "HH per Lakh",
            "Type",
        ]
    )

    for item in interventions:
        writer.writerow(
            [
                item.get("rank"),
                item.get("name"),
                item.get("wards_covered"),
                item.get("households"),
                item.get("cost_lakh"),
                item.get("hh_per_lakh"),
                item.get("type"),
            ]
        )

    output.seek(0)
    headers = {"Content-Disposition": "attachment; filename=interventions.csv"}
    return StreamingResponse(output, media_type="text/csv", headers=headers)
