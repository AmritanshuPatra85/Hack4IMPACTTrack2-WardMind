export interface Ward {
  id: number;
  name: string;
  epi_score: number;
  solar_ghi: number;
  outage_hours: number;
  burden_pct: number;
  income_decile: number;
  lat: number;
  lng: number;
  created_at?: string;
  active_layer?: string;
}

export interface ShapFeature {
  name: string;
  value: number;
  direction: 'positive' | 'negative';
}

export interface ShapResult {
  ward_id: number;
  score: number;
  verdict: 'critical' | 'moderate' | 'good';
  explanation: string;
  features: ShapFeature[];
}

export interface Intervention {
  rank: number;
  name: string;
  wards: string;
  households: number;
  cost_lakh: number;
  hh_per_lakh: number;
  type: 'quick' | 'infra' | 'policy';
  description: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  epi: number;
  outage: number;
  burden: number;
  reliability: number;
  grid_loss: number;
  renewable: number;
  tariff: number;
}

export interface ForecastData {
  years: number[];
  optimal: number[];
  current: number[];
  bau: number[];
}

export interface SolarLive {
  location: string;
  ghi_now: number;
  ghi_forecast_24h: number;
  cloud_cover: number;
  temperature: number;
  source: string;
}

export interface CityStats {
  total_wards: number;
  critical_wards: number;
  moderate_wards: number;
  affected_hh: number;
  optimal_solar_sites: number;
  avg_epi: number;
}
