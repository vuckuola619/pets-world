import { create } from 'zustand'
import type { Locale } from '../lib/i18n'

/** Supported map tile style names */
type MapStyleName = 'voyager' | 'dark' | 'satellite'

/** Theme preference */
type ThemeMode = 'light' | 'dark' | 'system'

/** Maximum species that can be compared at once */
const MAX_COMPARE = 3

/** Global map state shape */
interface MapStore {
  selectedId: string | null
  hoveredId: string | null
  sidebarHoveredId: string | null
  searchQuery: string
  activeRegion: string
  mapStyle: MapStyleName
  searchOpen: boolean
  mobileOpen: boolean
  locale: Locale
  theme: ThemeMode
  compareIds: string[]
  compareOpen: boolean
  showFavoritesOnly: boolean
  arOpen: boolean
  setSearchOpen: (open: boolean) => void
  setSelectedId: (id: string | null) => void
  setHoveredId: (id: string | null) => void
  setSidebarHoveredId: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setActiveRegion: (r: string) => void
  setMapStyle: (s: MapStyleName) => void
  setMobileOpen: (open: boolean) => void
  toggleMobileOpen: () => void
  setLocale: (l: Locale) => void
  setTheme: (t: ThemeMode) => void
  addCompare: (id: string) => void
  removeCompare: (id: string) => void
  clearCompare: () => void
  setCompareOpen: (open: boolean) => void
  setShowFavoritesOnly: (show: boolean) => void
  setArOpen: (open: boolean) => void
}

export type { MapStyleName, ThemeMode }

/** Reads saved theme from localStorage (safe for SSR) */
function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem('wildlife-theme')
  if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
  return 'light'
}

/** Global map state store backed by Zustand */
export const useMapStore = create<MapStore>((set) => ({
  selectedId: null,
  hoveredId: null,
  sidebarHoveredId: null,
  searchQuery: '',
  activeRegion: 'All',
  mapStyle: 'voyager',
  searchOpen: false,
  mobileOpen: false,
  locale: 'en' as Locale,
  theme: getSavedTheme(),
  compareIds: [],
  compareOpen: false,
  showFavoritesOnly: false,
  arOpen: false,
  setSelectedId: (id) => set({ selectedId: id }),
  setHoveredId: (id) => set({ hoveredId: id }),
  setSidebarHoveredId: (id) => set({ sidebarHoveredId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveRegion: (r) => set({ activeRegion: r }),
  setMapStyle: (s) => set({ mapStyle: s }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setMobileOpen: (open) => set({ mobileOpen: open }),
  toggleMobileOpen: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
  setLocale: (l) => set({ locale: l }),
  setTheme: (t) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wildlife-theme', t)
      const isDark = t === 'dark' || (t === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches)
      set({ theme: t, mapStyle: isDark ? 'satellite' : 'voyager' })
    } else {
      set({ theme: t })
    }
  },
  addCompare: (id) =>
    set((s) => {
      if (s.compareIds.includes(id) || s.compareIds.length >= MAX_COMPARE) return s
      return { compareIds: [...s.compareIds, id] }
    }),
  removeCompare: (id) =>
    set((s) => ({ compareIds: s.compareIds.filter((x) => x !== id) })),
  clearCompare: () => set({ compareIds: [], compareOpen: false }),
  setCompareOpen: (open) => set({ compareOpen: open }),
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
  setArOpen: (open) => set({ arOpen: open }),
}))
