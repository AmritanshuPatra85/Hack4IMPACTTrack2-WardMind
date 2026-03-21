import React from 'react'
import { Zap, Search, MapPin } from 'lucide-react'

interface NavbarProps {
  currentPage: string
  setPage: (page: string) => void
  onSearch: (query: string) => void
}

const navItems = [
  { label: 'Home', value: 'home' },
  { label: 'Compare', value: 'compare' },
  { label: 'Map', value: 'map' },
  { label: 'Impact', value: 'impact' },
]

function Navbar({ currentPage, setPage, onSearch }: NavbarProps) {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-800 bg-[#0a0f1e] px-8">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#4ade80]" />
          <span className="text-[18px] font-bold text-white">GridMind AI</span>
        </div>
        <span className="text-xs text-gray-500">Energy Equity Intelligence</span>
      </div>

      <nav className="flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = currentPage === item.value

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setPage(item.value)}
              className={
                isActive
                  ? 'border-b-2 border-[#4ade80] pb-1 text-[#4ade80]'
                  : 'pb-1 text-gray-400 transition hover:text-white'
              }
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="flex items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search ward..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-48 rounded-lg border border-gray-700 bg-[#1a2235] py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
        <button type="button" className="ml-3 text-gray-400 transition hover:text-green-400" aria-label="Open map">
          <MapPin className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

export default Navbar
