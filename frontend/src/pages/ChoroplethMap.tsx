import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import { Layers, AlertTriangle, Activity, CheckCircle } from 'lucide-react'
import { useAppStore } from '../store/index'
import { fetchWards, fetchShap } from '../api/index'
import { Ward, ShapResult } from '../types/index'
import 'leaflet/dist/leaflet.css'

const LAYER_KEYS = ['epi', 'solar', 'outage', 'income'] as const
type Layer = typeof LAYER_KEYS[number]

const LAYER_LABELS: Record<Layer, string> = {
  epi: 'EPI Score',
  solar: 'Solar Potential',
  outage: 'Outage Hours',
  income: 'Income Decile',
}

function getEpiColor(score: number) {
  if (score > 0.7) return '#ef4444'
  if (score > 0.4) return '#f59e0b'
  return '#4ade80'
}

function getLayerColor(ward: Ward, layer: Layer) {
  switch (layer) {
    case 'epi': return getEpiColor(ward.epi_score)
    case 'solar': return ward.solar_ghi > 5.8 ? '#4ade80' : ward.solar_ghi > 5.2 ? '#f59e0b' : '#ef4444'
    case 'outage': return ward.outage_hours > 6 ? '#ef4444' : ward.outage_hours > 3 ? '#f59e0b' : '#4ade80'
    case 'income': return ward.income_decile <= 3 ? '#ef4444' : ward.income_decile <= 6 ? '#f59e0b' : '#4ade80'
  }
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'critical') return (
    <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30">
      <AlertTriangle className="h-3 w-3" /> CRITICAL
    </span>
  )
  if (verdict === 'moderate') return (
    <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
      <Activity className="h-3 w-3" /> MODERATE
    </span>
  )
  return (
    <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/30">
      <CheckCircle className="h-3 w-3" /> GOOD
    </span>
  )
}

function ShapBar({ name, impact }: { name: string; impact: number }) {
  const isPositive = impact > 0
  const width = Math.min(Math.abs(impact) * 400, 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{name.replace(/_/g, ' ')}</span>
        <span className={isPositive ? 'text-red-400' : 'text-green-400'}>
          {isPositive ? '+' : ''}{impact.toFixed(3)}
        </span>
      </div>
      <div className="h-2 w-full rounded bg-gray-800">
        <div
          className={`h-2 rounded transition-all duration-500 ${isPositive ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export default function ChoroplethMap() {
  const { wards, setWards, selectedWard, setSelectedWard, selectedLayer, setSelectedLayer } = useAppStore()
  const [geoJson, setGeoJson] = useState<any>(null)
  const [shap, setShap] = useState<any>(null)
  const [telemetry, setTelemetry] = useState<any>(null)
  const [shapLoading, setShapLoading] = useState(false)
  const geoJsonRef = useRef<any>(null)

  useEffect(() => {
    fetch('/wards.geojson').then(r => r.json()).then(setGeoJson)
    if (wards.length === 0) {
      fetchWards().then(setWards)
    }
  }, [])

  const handleWardClick = async (ward: Ward) => {
    setSelectedWard(ward)
    setShapLoading(true)
    setShap(null)
    setTelemetry(null)
    try {
      const [shapData, telData] = await Promise.all([
        fetch(`/api/wards/${ward.id}/shap`).then(r => r.json()),
        fetch(`/api/wards/${ward.id}/telemetry`).then(r => r.json())
      ])
      setShap(shapData)
      setTelemetry(telData)
    } catch (err) {
      const shapFallback = await fetchShap(ward.id)
      setShap(shapFallback)
    } finally {
      setShapLoading(false)
    }
  }

  const styleFeature = (feature: any) => {
    const ward = wards.find(w => w.name === feature.properties.name || w.id === feature.properties.ward_id)
    return {
      fillColor: ward ? getLayerColor(ward, selectedLayer as Layer) : '#6b7280',
      fillOpacity: 0.7,
      color: '#ffffff',
      weight: 1,
    }
  }

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => {
        const ward = wards.find(w => w.name === feature.properties.name || w.id === feature.properties.ward_id)
        if (ward) handleWardClick(ward)
      },
      mouseover: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.9, weight: 2 })
        const ward = wards.find(w => w.name === feature.properties.name || w.id === feature.properties.ward_id)
        if (ward) {
          layer.bindTooltip(`
            <div style="background:#1a2235;border:1px solid #374151;padding:8px 12px;border-radius:8px;color:white;min-width:160px">
              <div style="font-weight:bold;margin-bottom:4px">${ward.name}</div>
              <div style="color:#9ca3af;font-size:12px">EPI: <span style="color:${getEpiColor(ward.epi_score)};font-weight:bold">${ward.epi_score.toFixed(2)}</span></div>
              <div style="color:#9ca3af;font-size:12px">Outage: ${ward.outage_hours}hrs/day</div>
              <div style="color:#4ade80;font-size:11px;margin-top:4px">Click to analyze \u2192</div>
            </div>
          `, { permanent: false, direction: 'top', className: 'custom-tooltip' }).openTooltip()
        }
      },
      mouseout: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.7, weight: 1 })
        layer.unbindTooltip()
      }
    })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0f1e]">
      <div className="relative flex-1">
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          {LAYER_KEYS.map(layer => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                selectedLayer === layer
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-[#1a2235] text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              <Layers className="h-3 w-3" />
              {LAYER_LABELS[layer]}
            </button>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-[#1a2235] p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-2 font-medium">Legend</p>
          {[['#ef4444', 'Critical (>0.7)'], ['#f59e0b', 'Moderate (0.4\u20130.7)'], ['#4ade80', 'Good (<0.4)']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-300">{label}</span>
            </div>
          ))}
        </div>

        {geoJson && (
          <MapContainer
            center={[20.296, 85.824]}
            zoom={12}
            style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
            />
            <GeoJSON
              key={selectedLayer}
              data={geoJson}
              style={styleFeature}
              onEachFeature={onEachFeature}
              ref={geoJsonRef}
            />
          </MapContainer>
        )}

        {!geoJson && (
          <div className="flex h-full items-center justify-center text-gray-500">
            Loading map...
          </div>
        )}
      </div>

      <div className="w-96 overflow-y-auto border-l border-gray-800 bg-[#111827] p-6">
        {!selectedWard && !shapLoading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-800 p-4 mb-4">
              <Layers className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">{'\u2190 Click any ward on the map'}</p>
            <p className="text-gray-600 text-xs mt-1">to analyze its energy poverty score</p>
          </div>
        )}

        {shapLoading && (
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
            <div className="h-20 w-full animate-pulse rounded bg-gray-700" />
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-full animate-pulse rounded bg-gray-700" />)}
            </div>
          </div>
        )}

        {selectedWard && shap && !shapLoading && (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedWard.name}</h2>
                <p className="text-gray-500 text-xs mt-1">Ward ID: {selectedWard.id}</p>
              </div>
              <VerdictBadge verdict={shap.verdict} />
            </div>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 mb-5">
              <p className="text-blue-300 text-sm leading-relaxed">{shap.explanation}</p>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">AI Explanation (SHAP)</h3>
              <div className="text-xs text-gray-500 flex justify-between mb-2">
                <span>{'\u{1F7E2} negative = improves score'}</span>
                <span>{'\u{1F534} positive = worsens'}</span>
              </div>
              {shap.features.map((f: any) => (
                <ShapBar key={f.name} name={f.name} impact={f.impact} />
              ))}
            </div>

            {telemetry && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Live Telemetry</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Outage hrs/day', telemetry.outage_hrs, 'text-red-400'],
                    ['Peak Load MW', telemetry.peak_load_mw, 'text-amber-400'],
                    ['Voltage Sags', telemetry.voltage_sags, 'text-amber-400'],
                    ['Solar GHI', telemetry.solar_ghi, 'text-green-400'],
                    ['Grid Freq Hz', telemetry.grid_freq, 'text-blue-400'],
                    ['DT Failures', telemetry.dt_failures, 'text-red-400'],
                  ].map(([label, value, color]) => (
                    <div key={label as string} className="rounded-lg bg-[#1a2235] p-3">
                      <p className="text-xs text-gray-500">{label as string}</p>
                      <p className={`text-lg font-bold ${color as string}`}>{value as number}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-[#1a2235] p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">EPI Score</span>
                <span className={`text-2xl font-bold ${getEpiColor(shap.prediction) === '#ef4444' ? 'text-red-400' : getEpiColor(shap.prediction) === '#f59e0b' ? 'text-amber-400' : 'text-green-400'}`}>
                  {shap.prediction.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded bg-gray-800">
                <div
                  className="h-2 rounded bg-gradient-to-r from-green-500 via-amber-500 to-red-500"
                  style={{ width: `${shap.prediction * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => alert('PDF export \u2014 connect to /api/export/ward-report')}
              className="w-full rounded-lg bg-green-500/20 border border-green-500/30 py-3 text-sm font-medium text-green-400 hover:bg-green-500/30 transition-all"
            >
              Generate Ward Report {'\u2192'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
