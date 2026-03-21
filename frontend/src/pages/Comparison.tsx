import React, { useEffect, useState } from 'react'
import { fetchCities, fetchInterventions } from '../api/index'
import { City, Intervention } from '../types/index'

const metrics = [
  { label: 'Outage Hours/day', key: 'outage', higherIsBetter: false },
  { label: 'Energy Burden %', key: 'burden', higherIsBetter: false },
  { label: 'Grid Reliability %', key: 'reliability', higherIsBetter: true },
  { label: 'Grid Loss %', key: 'grid_loss', higherIsBetter: false },
  { label: 'Renewable %', key: 'renewable', higherIsBetter: true },
  { label: 'Tariff \u20B9/unit', key: 'tariff', higherIsBetter: false },
] as const

function Comparison() {
  const [cities, setCities] = useState<City[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [cityA, setCityA] = useState('bbsr')
  const [cityB, setCityB] = useState('pune')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)

      try {
        const [citiesData, interventionsData] = await Promise.all([
          fetchCities(),
          fetchInterventions(),
        ])

        if (!isMounted) return

        setCities(citiesData)
        setInterventions(interventionsData)
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const getCity = (id: string) => cities.find((c) => c.id === id)

  const selectedCityA = getCity(cityA)
  const selectedCityB = getCity(cityB)

  const getValueClass = (a: number, b: number, higherIsBetter: boolean, target: 'a' | 'b') => {
    if (a === b) return 'text-white'

    const aIsBetter = higherIsBetter ? a > b : a < b
    const isBetter = target === 'a' ? aIsBetter : !aIsBetter

    return isBetter ? 'text-emerald-400' : 'text-red-400'
  }

  const exportCsv = () => {
    const header = ['Rank', 'Intervention', 'Wards', 'Households', 'Cost (\u20B9L)', 'HH/Lakh', 'Type']
    const rows = interventions.map((item) => [
      item.rank,
      item.name,
      item.wards,
      item.households,
      item.cost_lakh,
      item.hh_per_lakh,
      item.type,
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'interventions.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-8">
      <section className="mb-8">
        <h1 className="mb-6 text-2xl font-bold text-white">City Comparison</h1>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 animate-pulse rounded bg-gray-700" />
            <div className="h-12 animate-pulse rounded bg-gray-700" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <select
              value={cityA}
              onChange={(e) => setCityA(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#1a2235] p-3 text-white"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>

            <select
              value={cityB}
              onChange={(e) => setCityB(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#1a2235] p-3 text-white"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-[#1a2235] p-4">
                  <div className="mb-3 h-4 w-28 animate-pulse rounded bg-gray-700" />
                  <div className="flex gap-4">
                    <div className="h-7 w-16 animate-pulse rounded bg-gray-700" />
                    <div className="h-7 w-16 animate-pulse rounded bg-gray-700" />
                  </div>
                </div>
              ))
            : metrics.map((metric) => {
                const valueA = selectedCityA?.[metric.key] ?? 0
                const valueB = selectedCityB?.[metric.key] ?? 0

                return (
                  <div key={metric.label} className="rounded-xl bg-[#1a2235] p-4">
                    <p className="mb-2 text-sm text-gray-400">{metric.label}</p>
                    <div className="flex items-center justify-between gap-4 text-lg font-semibold">
                      <span className={getValueClass(valueA, valueB, metric.higherIsBetter, 'a')}>{valueA}</span>
                      <span className={getValueClass(valueA, valueB, metric.higherIsBetter, 'b')}>{valueB}</span>
                    </div>
                  </div>
                )
              })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-white">Highest ROI Interventions</h2>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2 text-sm text-green-400"
          >
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-gray-700" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-[#111827] text-left text-gray-300">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Intervention</th>
                  <th className="px-4 py-3">Wards</th>
                  <th className="px-4 py-3">Households</th>
                  <th className="px-4 py-3">Cost ({'\u20B9L'})</th>
                  <th className="px-4 py-3">HH/Lakh</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {interventions.map((item) => (
                  <tr key={item.rank} className="border-b border-gray-800 bg-[#1a2235] hover:bg-[#1e2a42]">
                    <td className="px-4 py-3 text-white">{item.rank}</td>
                    <td className="px-4 py-3 text-white">{item.name}</td>
                    <td className="px-4 py-3 text-gray-300">{item.wards}</td>
                    <td className="px-4 py-3 text-gray-300">{item.households.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300">{item.cost_lakh}</td>
                    <td className="px-4 py-3 font-bold text-green-400">{item.hh_per_lakh}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.type === 'quick'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : item.type === 'infra'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-blue-500/15 text-blue-300'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Comparison
