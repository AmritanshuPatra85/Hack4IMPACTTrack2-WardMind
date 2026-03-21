import React, { useEffect, useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Zap, Leaf, Globe, Shield, BarChart2, Code } from 'lucide-react'
import { fetchForecast } from '../api/index'
import { ForecastData } from '../types/index'

function useCountUp(target: number, duration: number = 1500, started: boolean = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!started) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, started])
  return count
}

const MISSION_CARDS = [
  { icon: Globe, title: 'Open Data', desc: 'Built entirely on NREL, POSOCO, and Census open datasets. No vendor lock-in.', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: Shield, title: 'Explainable AI', desc: 'Every prediction comes with a SHAP explanation. No black boxes.', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { icon: Zap, title: 'Edge Deployable', desc: 'ONNX-exported models run on Raspberry Pi 4. No cloud dependency.', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { icon: BarChart2, title: 'DISCOM Ready', desc: 'REST API + MQTT integration. Onboard any utility in under 1 day.', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
  { icon: Leaf, title: 'Carbon Tracking', desc: 'Real-time CO\u2082 intensity dashboard. Meets EU AI Act requirements.', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { icon: Code, title: 'MIT Licensed', desc: 'Fully open source. Deploy, fork, and extend freely.', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
]

export default function Impact() {
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const c1 = useCountUp(240000, 1500, started)
  const c2 = useCountUp(127, 1500, started)
  const c3 = useCountUp(42000, 1500, started)
  const c4 = useCountUp(23, 1500, started)
  const c5 = useCountUp(265000, 1500, started)
  const c6 = useCountUp(6, 1500, started)

  useEffect(() => {
    fetchForecast().then(data => {
      setForecast(data)
      setLoading(false)
    })

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const chartData = forecast
    ? forecast.years.map((year, i) => ({
        year,
        Optimal: forecast.optimal[i],
        Current: forecast.current[i],
        BAU: forecast.bau[i],
      }))
    : []

  const STATS = [
    { label: 'Households Affected', value: c1.toLocaleString(), suffix: '', color: 'text-red-400' },
    { label: 'Wards Analyzed', value: c2.toLocaleString(), suffix: '', color: 'text-blue-400' },
    { label: 'CO\u2082 Offset (tonnes)', value: c3.toLocaleString(), suffix: '/yr', color: 'text-green-400' },
    { label: 'Energy Cost Reduction', value: c4.toLocaleString(), suffix: '%', color: 'text-amber-400' },
    { label: 'Households by 2035', value: c5.toLocaleString(), suffix: '+', color: 'text-purple-400' },
    { label: 'Intervention Types', value: c6.toLocaleString(), suffix: '', color: 'text-teal-400' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Projected Impact</h1>
        <p className="text-gray-400">What GridMind AI can achieve at full deployment across Bhubaneswar</p>
      </div>

      <div ref={sectionRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
        {STATS.map(({ label, value, suffix, color }) => (
          <div key={label} className="rounded-xl bg-[#1a2235] p-6 text-center border border-gray-800">
            <p className={`text-4xl font-bold ${color}`}>{value}{suffix}</p>
            <p className="text-gray-400 text-sm mt-2">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[#1a2235] p-6 mb-12 max-w-5xl mx-auto border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-1">
          Households lifted from energy poverty (2025\u20132035)
        </h2>
        <p className="text-gray-500 text-sm mb-6">Three scenarios based on deployment speed</p>

        {loading ? (
          <div className="h-64 w-full animate-pulse rounded bg-gray-700" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="year" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                formatter={(value: number) => [value.toLocaleString(), '']}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line type="monotone" dataKey="Optimal" stroke="#4ade80" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Current" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="BAU" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Why GridMind AI</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MISSION_CARDS.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className={`rounded-xl border p-5 ${bg}`}>
              <Icon className={`h-6 w-6 ${color} mb-3`} />
              <h3 className="text-white font-semibold mb-1">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
