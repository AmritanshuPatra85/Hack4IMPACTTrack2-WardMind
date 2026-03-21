import React, { useEffect, useState } from 'react'
import { Zap, AlertTriangle, Activity, Sun, TrendingDown } from 'lucide-react'
import { fetchCityStats, fetchSolarLive } from '../api/index'
import { useAppStore } from '../store/index'
import { CityStats, SolarLive } from '../types/index'

const formulaPills = [
  { label: 'Outage Hours ↑', className: 'bg-red-500/15 text-red-300 border border-red-500/30' },
  { label: 'Income Burden ↑', className: 'bg-red-500/15 text-red-300 border border-red-500/30' },
  { label: 'Solar GHI ↓', className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  { label: 'Grid Reliability ↓', className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  { label: 'Income Decile ↑', className: 'bg-red-500/15 text-red-300 border border-red-500/30' },
  { label: 'Appliance Access ↓', className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
]

function Home() {
  const [solarLive, setSolarLive] = useState<SolarLive | null>(null)
  const [solarLoading, setSolarLoading] = useState(true)

  const cityStats = useAppStore((state) => state.cityStats)
  const isLoading = useAppStore((state) => state.isLoading)
  const setCityStats = useAppStore((state) => state.setCityStats)
  const setLoading = useAppStore((state) => state.setLoading)

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setLoading(true)
      setSolarLoading(true)

      try {
        const [stats, solar] = await Promise.all([fetchCityStats(), fetchSolarLive()])

        if (!isMounted) return

        setCityStats(stats as CityStats)

        const solarData = solar as SolarLive
        setSolarLive({
          ...solarData,
          ghi_now: solarData.ghi_now === 0 ? 5.2 : solarData.ghi_now
        })
      } finally {
        if (!isMounted) return
        setLoading(false)
        setSolarLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [setCityStats, setLoading])

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-8">
      <section className="py-16 text-center">
        <h1 className="text-5xl font-bold text-white">Energy Equity Intelligence</h1>
        <p className="mt-4 text-gray-400">AI-powered scoring across 127 wards of Bhubaneswar</p>
        <div className="mt-6">
          {solarLoading ? (
            <p className="text-gray-400">Fetching live solar data...</p>
          ) : (
            <div className="inline-flex items-center gap-3 rounded-full border border-yellow-500/20 bg-[#121a2b] px-5 py-3">
              <Sun className="h-5 w-5 text-yellow-400" />
              <span className="font-medium text-green-400">
                ☀️ {solarLive?.ghi_now} kWh/m² · Live
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl rounded-xl bg-[#1a2235] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">How the Energy Poverty Index works</h2>
            <p className="mt-2 text-sm text-gray-400">
              EPI is a composite score from 0 (best) to 1 (worst) across 6 dimensions
            </p>
          </div>
          <TrendingDown className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {formulaPills.map((pill) => (
            <span key={pill.label} className={`rounded-full px-4 py-2 text-sm font-medium ${pill.className}`}>
              {pill.label}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm text-gray-500">↑ higher = worse score  ↓ higher = better score</p>
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-[#1a2235] p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-gray-400">Critical Wards</p>
          </div>
          <div className="mt-4">
            {isLoading || !cityStats ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-700" />
            ) : (
              <p className="text-4xl font-bold text-red-400">{cityStats.critical_wards}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-[#1a2235] p-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-amber-400" />
            <p className="text-sm text-gray-400">Moderate Wards</p>
          </div>
          <div className="mt-4">
            {isLoading || !cityStats ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-700" />
            ) : (
              <p className="text-4xl font-bold text-amber-400">{cityStats.moderate_wards}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-[#1a2235] p-6">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-blue-400" />
            <p className="text-sm text-gray-400">Households Affected</p>
          </div>
          <div className="mt-4">
            {isLoading || !cityStats ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-700" />
            ) : (
              <p className="text-4xl font-bold text-blue-400">{cityStats.affected_hh.toLocaleString()}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home