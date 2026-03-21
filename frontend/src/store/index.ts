import { create } from 'zustand'
import { Ward, CityStats } from '../types/index'

interface AppState {
  selectedWard: Ward | null
  selectedLayer: 'epi' | 'solar' | 'outage' | 'income'
  wards: Ward[]
  cityStats: CityStats | null
  isLoading: boolean
  demoMode: boolean
  setSelectedWard: (ward: Ward | null) => void
  setSelectedLayer: (layer: 'epi' | 'solar' | 'outage' | 'income') => void
  setWards: (wards: Ward[]) => void
  setCityStats: (stats: CityStats) => void
  setLoading: (loading: boolean) => void
  setDemoMode: (on: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedWard: null,
  selectedLayer: 'epi',
  wards: [],
  cityStats: null,
  isLoading: false,
  demoMode: false,
  setSelectedWard: (ward) => set({ selectedWard: ward }),
  setSelectedLayer: (layer) => set({ selectedLayer: layer }),
  setWards: (wards) => set({ wards }),
  setCityStats: (stats) => set({ cityStats: stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setDemoMode: (on) => set({ demoMode: on }),
}))
