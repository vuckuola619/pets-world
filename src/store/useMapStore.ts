import { create } from 'zustand'
import type { Locale } from '../lib/i18n'

/** Supported map tile style names */
type MapStyleName = 'voyager' | 'dark' | 'satellite'

/** Active atlas data mode */
type AtlasMode = 'wildlife' | 'prehistoric'

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
  atlasMode: AtlasMode
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
  setAtlasMode: (m: AtlasMode) => void
  addCompare: (id: string) => void
  removeCompare: (id: string) => void
  clearCompare: () => void
  setCompareOpen: (open: boolean) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  clearFavorites: () => void
  setShowFavoritesOnly: (show: boolean) => void
  setArOpen: (open: boolean) => void
}

export type { AtlasMode, MapStyleName, ThemeMode }

/** Reads saved theme from localStorage (safe for SSR) */
function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem('wildlife-theme')
  if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
  return 'light'
}

const FAVORITES_KEY = 'wildlife-favorites'

/** Reads favorite ids from localStorage (safe for SSR) */
function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Writes favorite ids to localStorage */
function writeFavorites(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/** Persists the locale and keeps <html lang> in sync for screen readers */
function setLocaleEffects(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('wildlife-locale', locale)
  } catch {
    // localStorage unavailable — locale still applies for this session
  }
  document.documentElement.lang = locale
}

/** Global map state store backed by Zustand */
export const useMapStore = create<MapStore>((set) => ({
  selectedId: null,
  hoveredId: null,
  sidebarHoveredId: null,
  searchQuery: '',
  activeRegion: 'All',
  mapStyle: 'satellite',
  searchOpen: false,
  mobileOpen: false,
  locale: 'en' as Locale,
  theme: getSavedTheme(),
  atlasMode: 'wildlife',
  compareIds: [],
  compareOpen: false,
  favorites: readFavorites(),
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
  setLocale: (l) => {
    setLocaleEffects(l)
    set({ locale: l })
  },
  setTheme: (t) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wildlife-theme', t)
      set({ theme: t, mapStyle: 'satellite' })
    } else {
      set({ theme: t })
    }
  },
  setAtlasMode: (mode) =>
    set({
      atlasMode: mode,
      selectedId: null,
      hoveredId: null,
      sidebarHoveredId: null,
      searchQuery: '',
      activeRegion: 'All',
      mobileOpen: false,
      compareIds: [],
      compareOpen: false,
    }),
  addCompare: (id) =>
    set((s) => {
      if (s.compareIds.includes(id) || s.compareIds.length >= MAX_COMPARE) return s
      return { compareIds: [...s.compareIds, id] }
    }),
  removeCompare: (id) =>
    set((s) => ({ compareIds: s.compareIds.filter((x) => x !== id) })),
  clearCompare: () => set({ compareIds: [], compareOpen: false }),
  setCompareOpen: (open) => set({ compareOpen: open }),
  toggleFavorite: (id) =>
    set((s) => {
      const next = s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id]
      writeFavorites(next)
      return { favorites: next }
    }),
  clearFavorites: () => {
    writeFavorites([])
    set({ favorites: [] })
  },
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
  setArOpen: (open) => set({ arOpen: open }),
}))
