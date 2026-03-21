import React, { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Comparison from './pages/Comparison'
import ChoroplethMap from './pages/ChoroplethMap'
import Impact from './pages/Impact'
import { useAppStore } from './store/index'

function App() {
  const [page, setPage] = useState('home')
  const { wards, setSelectedWard } = useAppStore()

  const handleSearch = (query: string) => {
    if (query.length > 2) {
      const match = wards.find(w =>
        w.name.toLowerCase().includes(query.toLowerCase())
      )
      if (match) {
        setSelectedWard(match)
        setPage('map')
      }
    }
  }

  const handleGPS = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      const nearest = wards.reduce((prev, curr) => {
        const prevDist = Math.abs(prev.lat - latitude) + Math.abs(prev.lng - longitude)
        const currDist = Math.abs(curr.lat - latitude) + Math.abs(curr.lng - longitude)
        return currDist < prevDist ? curr : prev
      })
      setSelectedWard(nearest)
      setPage('map')
    })
  }

  const renderPage = () => {
    switch(page) {
      case 'home': return <Home />
      case 'compare': return <Comparison />
      case 'map': return <ChoroplethMap />
      case 'impact': return <Impact />
      default: return <Home />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Navbar currentPage={page} setPage={setPage} onSearch={handleSearch} onGPS={handleGPS} />
      <div className="pt-16">
        {renderPage()}
      </div>
    </div>
  )
}

export default App