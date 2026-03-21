import type {
  Ward,
  ShapResult,
  City,
  Intervention,
  ForecastData,
  SolarLive,
  CityStats,
} from '../types/index'

const API_BASE = 'http://localhost:8000'

const MOCK_WARDS: Ward[] = [
  { id: 1, name: "Nayapalli", epi_score: 0.81, solar_ghi: 5.8, outage_hours: 7.2, burden_pct: 14.3, income_decile: 2, lat: 20.2961, lng: 85.8245 },
  { id: 2, name: "Aiginia", epi_score: 0.76, solar_ghi: 6.1, outage_hours: 6.8, burden_pct: 12.1, income_decile: 3, lat: 20.2801, lng: 85.8123 },
  { id: 3, name: "Khandagiri", epi_score: 0.45, solar_ghi: 5.4, outage_hours: 3.2, burden_pct: 8.4, income_decile: 5, lat: 20.2654, lng: 85.7801 },
  { id: 4, name: "Patrapada", epi_score: 0.88, solar_ghi: 6.3, outage_hours: 8.5, burden_pct: 18.2, income_decile: 1, lat: 20.2345, lng: 85.8012 },
  { id: 5, name: "Mancheswar", epi_score: 0.32, solar_ghi: 5.1, outage_hours: 2.1, burden_pct: 5.2, income_decile: 7, lat: 20.3012, lng: 85.8456 },
  { id: 6, name: "Rasulgarh", epi_score: 0.55, solar_ghi: 5.6, outage_hours: 4.5, burden_pct: 9.8, income_decile: 4, lat: 20.2890, lng: 85.8334 },
  { id: 7, name: "Baramunda", epi_score: 0.28, solar_ghi: 5.2, outage_hours: 1.8, burden_pct: 4.1, income_decile: 8, lat: 20.2723, lng: 85.8067 },
  { id: 8, name: "Sailashree Vihar", epi_score: 0.62, solar_ghi: 5.9, outage_hours: 5.1, burden_pct: 11.3, income_decile: 4, lat: 20.3145, lng: 85.8589 },
  { id: 9, name: "Dumduma", epi_score: 0.71, solar_ghi: 6.0, outage_hours: 6.0, burden_pct: 13.5, income_decile: 3, lat: 20.3234, lng: 85.8712 },
  { id: 10, name: "Pokhariput", epi_score: 0.39, solar_ghi: 5.3, outage_hours: 2.8, burden_pct: 6.7, income_decile: 6, lat: 20.2512, lng: 85.7923 }
]

const MOCK_SHAP: Record<number, ShapResult> = {
  1: { ward_id: 1, score: 0.81, verdict: 'critical', explanation: 'Outage hours is the dominant driver at 7.2 hrs/day \u2014 2.3x above district mean. High income burden compounds the effect.', features: [ { name: 'Outage hours', value: 0.38, direction: 'positive' }, { name: 'Income burden', value: 0.29, direction: 'positive' }, { name: 'Solar GHI', value: -0.18, direction: 'negative' }, { name: 'Income decile', value: 0.14, direction: 'positive' }, { name: 'Grid reliability', value: -0.08, direction: 'negative' } ] },
  2: { ward_id: 2, score: 0.76, verdict: 'critical', explanation: 'High outage hours and low income decile make Ward 2 critical. Strong solar potential offers an intervention opportunity.', features: [ { name: 'Outage hours', value: 0.32, direction: 'positive' }, { name: 'Income burden', value: 0.24, direction: 'positive' }, { name: 'Solar GHI', value: -0.22, direction: 'negative' }, { name: 'Income decile', value: 0.18, direction: 'positive' }, { name: 'Grid reliability', value: -0.06, direction: 'negative' } ] }
}

const MOCK_STATS: CityStats = { total_wards: 127, critical_wards: 43, moderate_wards: 51, affected_hh: 240000, optimal_solar_sites: 23, avg_epi: 0.58 }

const MOCK_SOLAR: SolarLive = { location: 'Bhubaneswar', ghi_now: 5.4, ghi_forecast_24h: 5.8, cloud_cover: 12, temperature: 31, source: 'Open-Meteo' }

const MOCK_FORECAST: ForecastData = { years: [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035], optimal: [0, 18000, 42000, 78000, 115000, 158000, 192000, 218000, 238000, 252000, 265000], current: [0, 8000, 18000, 32000, 51000, 74000, 98000, 124000, 148000, 168000, 185000], bau: [0, 3000, 7000, 12000, 18000, 25000, 33000, 42000, 52000, 63000, 75000] }

const MOCK_CITIES: City[] = [
  { id: 'bbsr', name: 'Bhubaneswar', state: 'Odisha', epi: 0.58, outage: 5.2, burden: 11.2, reliability: 62, grid_loss: 8.4, renewable: 18, tariff: 5.8 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', epi: 0.31, outage: 1.8, burden: 6.1, reliability: 89, grid_loss: 4.2, renewable: 34, tariff: 7.2 },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', epi: 0.44, outage: 3.1, burden: 8.9, reliability: 74, grid_loss: 6.8, renewable: 41, tariff: 6.1 }
]

const MOCK_INTERVENTIONS: Intervention[] = [
  { rank: 1, name: 'Rooftop Solar Cluster (50kW)', wards: 'Patrapada, Nayapalli', households: 1200, cost_lakh: 28, hh_per_lakh: 42.8, type: 'quick', description: 'Community solar installation with net metering' },
  { rank: 2, name: 'Grid Feeder Upgrade', wards: 'Aiginia, Dumduma', households: 2100, cost_lakh: 65, hh_per_lakh: 32.3, type: 'infra', description: 'Replace aging 11kV feeders to reduce outage hours' },
  { rank: 3, name: 'PM-KUSUM Subsidy Application', wards: 'Pokhariput, Khandagiri', households: 890, cost_lakh: 12, hh_per_lakh: 74.2, type: 'policy', description: 'Fast-track subsidy processing for solar pumps' }
]

async function apiFetch<T>(url: string, mockData: T): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as T
  } catch (err) {
    clearTimeout(timeout)
    console.warn(`[GridMind] Using mock data for ${url}:`, err)
    return mockData
  }
}

export const fetchWards = () => apiFetch('/api/wards', MOCK_WARDS)
export const fetchCityStats = () => apiFetch('/api/stats/city', MOCK_STATS)
export const fetchShap = (id: number) => apiFetch(`/api/wards/${id}/shap`, MOCK_SHAP[id] ?? MOCK_SHAP[1])
export const fetchCities = () => apiFetch('/api/cities', MOCK_CITIES)
export const fetchInterventions = () => apiFetch('/api/interventions', MOCK_INTERVENTIONS)
export const fetchSolarLive = () => apiFetch('/api/solar/live', MOCK_SOLAR)
export const fetchForecast = () => apiFetch('/api/forecast/city', MOCK_FORECAST)
