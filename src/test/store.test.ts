import { describe, it, expect, beforeEach } from 'vitest'
import { useMapStore } from '../store/useMapStore'

describe('useMapStore', () => {
  beforeEach(() => {
    useMapStore.setState({
      selectedId: null,
      hoveredId: null,
      sidebarHoveredId: null,
      searchQuery: '',
      activeRegion: 'All',
      atlasMode: 'wildlife',
      mapStyle: 'voyager',
      mobileOpen: false,
      compareIds: [],
      compareOpen: false,
      focusTarget: null,
    })
  })

  it('selects a country', () => {
    useMapStore.getState().setSelectedId('id')
    expect(useMapStore.getState().selectedId).toBe('id')
  })

  it('clears selection', () => {
    useMapStore.getState().setSelectedId('id')
    useMapStore.getState().setSelectedId(null)
    expect(useMapStore.getState().selectedId).toBeNull()
  })

  it('sets hover', () => {
    useMapStore.getState().setHoveredId('cn')
    expect(useMapStore.getState().hoveredId).toBe('cn')
  })

  it('sets search query', () => {
    useMapStore.getState().setSearchQuery('panda')
    expect(useMapStore.getState().searchQuery).toBe('panda')
  })

  it('sets active region', () => {
    useMapStore.getState().setActiveRegion('Asia')
    expect(useMapStore.getState().activeRegion).toBe('Asia')
  })

  it('defaults to wildlife atlas mode', () => {
    expect(useMapStore.getState().atlasMode).toBe('wildlife')
  })

  it('defaults to the minimal map style', () => {
    expect(useMapStore.getInitialState().mapStyle).toBe('minimal')
  })

  it('keeps the minimal style for the light theme', () => {
    useMapStore.getState().setMapStyle('dark')
    useMapStore.getState().setTheme('light')
    expect(useMapStore.getState().mapStyle).toBe('minimal')
  })

  it('switches atlas mode and clears stale map state', () => {
    useMapStore.getState().setSelectedId('id')
    useMapStore.getState().setHoveredId('cn')
    useMapStore.getState().setSidebarHoveredId('cn')
    useMapStore.getState().setActiveRegion('Asia')
    useMapStore.getState().addCompare('id')
    useMapStore.getState().setCompareOpen(true)

    useMapStore.getState().setAtlasMode('prehistoric')

    expect(useMapStore.getState().atlasMode).toBe('prehistoric')
    expect(useMapStore.getState().selectedId).toBeNull()
    expect(useMapStore.getState().hoveredId).toBeNull()
    expect(useMapStore.getState().sidebarHoveredId).toBeNull()
    expect(useMapStore.getState().activeRegion).toBe('All')
    expect(useMapStore.getState().compareIds).toEqual([])
    expect(useMapStore.getState().compareOpen).toBe(false)
  })

  it('toggles mobile open', () => {
    expect(useMapStore.getState().mobileOpen).toBe(false)
    useMapStore.getState().toggleMobileOpen()
    expect(useMapStore.getState().mobileOpen).toBe(true)
    useMapStore.getState().toggleMobileOpen()
    expect(useMapStore.getState().mobileOpen).toBe(false)
  })

  it('cycles map style', () => {
    useMapStore.getState().setMapStyle('dark')
    expect(useMapStore.getState().mapStyle).toBe('dark')
    useMapStore.getState().setMapStyle('minimal')
    expect(useMapStore.getState().mapStyle).toBe('minimal')
  })

  it('requests a camera focus with an incrementing nonce', () => {
    useMapStore.getState().setFocusTarget({ lng: 110, lat: -7 })
    const first = useMapStore.getState().focusTarget
    expect(first).toMatchObject({ lng: 110, lat: -7, nonce: 1 })

    // Same coordinates must still re-trigger the camera (nonce bumps)
    useMapStore.getState().setFocusTarget({ lng: 110, lat: -7 })
    expect(useMapStore.getState().focusTarget?.nonce).toBe(2)

    useMapStore.getState().setFocusTarget(null)
    expect(useMapStore.getState().focusTarget).toBeNull()
  })

  it('sets theme', () => {
    useMapStore.getState().setTheme('dark')
    expect(useMapStore.getState().theme).toBe('dark')
    useMapStore.getState().setTheme('system')
    expect(useMapStore.getState().theme).toBe('system')
    useMapStore.getState().setTheme('light')
    expect(useMapStore.getState().theme).toBe('light')
  })

  it('toggles showFavoritesOnly', () => {
    expect(useMapStore.getState().showFavoritesOnly).toBe(false)
    useMapStore.getState().setShowFavoritesOnly(true)
    expect(useMapStore.getState().showFavoritesOnly).toBe(true)
    useMapStore.getState().setShowFavoritesOnly(false)
    expect(useMapStore.getState().showFavoritesOnly).toBe(false)
  })

  it('toggles AR mode', () => {
    expect(useMapStore.getState().arOpen).toBe(false)
    useMapStore.getState().setArOpen(true)
    expect(useMapStore.getState().arOpen).toBe(true)
    useMapStore.getState().setArOpen(false)
    expect(useMapStore.getState().arOpen).toBe(false)
  })
})
