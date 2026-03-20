import io

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Ward, get_db
from app.models.schemas import WardReportRequest
from app.routers import wards as wards_router
from app.services.mock_data import get_mock_ward_by_id

router = APIRouter()


def _orm_to_dict(obj) -> dict:
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}


@router.post("/export/ward-report")
async def export_ward_report(payload: WardReportRequest, db: Session = Depends(get_db)):
    ward_id = payload.ward_id
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

    shap_data = await wards_router._fetch_shap(ward_id)
    telemetry_data = await wards_router._fetch_telemetry(ward_id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    story = []
    story.append(Paragraph(f"GridMind Ward Report: {ward['name']}", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"EPI Score: <b>{ward['epi_score']}</b>", styles["Heading2"]))
    story.append(Spacer(1, 12))

    shap_rows = [["Feature", "Value", "Impact"]]
    for feature in shap_data.get("features", []):
        shap_rows.append(
            [
                feature.get("name"),
                str(feature.get("value")),
                str(feature.get("impact")),
            ]
        )

    shap_table = Table(shap_rows, hAlign="LEFT")
    shap_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]
        )
    )
    story.append(Paragraph("SHAP Feature Contributions", styles["Heading3"]))
    story.append(shap_table)
    story.append(Spacer(1, 12))

    telemetry_rows = [["Metric", "Value"]]
    telemetry_rows.extend(
        [
            ["Timestamp", telemetry_data.get("timestamp")],
            ["Outage Hours", telemetry_data.get("outage_hrs")],
            ["Peak Load (MW)", telemetry_data.get("peak_load_mw")],
            ["Voltage Sags", telemetry_data.get("voltage_sags")],
            ["Solar GHI", telemetry_data.get("solar_ghi")],
            ["Grid Frequency", telemetry_data.get("grid_freq")],
            ["DT Failures", telemetry_data.get("dt_failures")],
        ]
    )

    telemetry_table = Table(telemetry_rows, hAlign="LEFT")
    telemetry_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]
        )
    )
    story.append(Paragraph("Telemetry Snapshot", styles["Heading3"]))
    story.append(telemetry_table)
    story.append(Spacer(1, 12))

    recommendation = (
        "AI Recommendation: Prioritize quick-win reliability measures while preparing "
        "infrastructure upgrades for the next budget cycle to reduce energy burden."
    )
    story.append(Paragraph(recommendation, styles["BodyText"]))

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()

    headers = {"Content-Disposition": f"attachment; filename=ward_{ward_id}_report.pdf"}
    return Response(content=pdf_data, media_type="application/pdf", headers=headers)

