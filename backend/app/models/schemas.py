from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class WardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    epi_score: float
    solar_ghi: float
    outage_hours: float
    burden_pct: float
    income_decile: int
    lat: float
    lng: float
    created_at: Optional[datetime] = None


class ShapFeature(BaseModel):
    name: str
    value: float
    impact: float


class WardShapResponse(BaseModel):
    ward_id: int
    base_value: float
    prediction: float
    features: List[ShapFeature]


class TelemetryResponse(BaseModel):
    ward_id: int
    timestamp: datetime
    outage_hrs: float
    peak_load_mw: float
    voltage_sags: float
    solar_ghi: float
    grid_freq: float
    dt_failures: int


class ForecastInterval(BaseModel):
    timestamp: datetime
    outage_hrs: float
    solar_ghi: float
    demand_mw: float


class ForecastResponse(BaseModel):
    ward_id: int
    intervals: List[ForecastInterval]


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    state: Optional[str] = None
    epi: float
    outage: float
    burden: float
    reliability: float
    grid_loss: float
    renewable: float
    tariff: float


class InterventionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rank: int
    name: str
    wards_covered: str
    households: int
    cost_lakh: float
    hh_per_lakh: float
    type: str
    description: Optional[str] = None


class SolarLiveResponse(BaseModel):
    ghi_now: float
    ghi_forecast_24h: List[float]
    cloud_cover: float
    temperature: float
    source: str


class CityStatsResponse(BaseModel):
    name: str
    epi: float
    outage: float
    burden: float
    reliability: float
    grid_loss: float
    renewable: float
    tariff: float


class CityForecastResponse(BaseModel):
    years: List[int]
    optimal: List[float]
    current: List[float]
    bau: List[float]


class HealthResponse(BaseModel):
    database: str
    redis: str
    ml_service: str
    last_data_refresh: datetime
    version: str


class WardReportRequest(BaseModel):
    ward_id: int


class ExportResponse(BaseModel):
    filename: str
    content_type: str
    bytes: int
