import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

/*
 * MapView drives a real MapLibre canvas, which jsdom cannot run (no WebGL).
 * The react-map-gl primitives are stubbed so the test can observe the DOM
 * marker output — the part that regressed when wildlife emoji markers were
 * gated behind zoom >= 7.5 and the world view showed only cluster bubbles.
 */
vi.mock('react-map-gl/maplibre', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Source: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Layer: () => null,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="dom-marker">{children}</div>
  ),
}))

import MapView from '../components/MapView'
import { useMapStore } from '../store/useMapStore'

function renderMap(zoom: number) {
  return render(
    <MapView viewState={{ longitude: 20, latitude: 20, zoom }} setViewState={vi.fn()} />
  )
}

describe('MapView DOM markers', () => {
  beforeEach(() => {
    useMapStore.setState({
      atlasMode: 'wildlife',
      selectedId: null,
      hoveredId: null,
      sidebarHoveredId: null,
      compareIds: [],
    })
  })

  afterEach(cleanup)

  it('shows animal emoji markers in wildlife mode at world zoom (< 7.5)', () => {
    renderMap(2)
    const markers = screen.getAllByTestId('dom-marker')
    expect(markers.length).toBeGreaterThan(0)
    // Giant Panda is in the default wildlife dataset
    expect(screen.getAllByTestId('dom-marker').some((m) => m.textContent?.includes('🐼'))).toBe(true)
  })

  it('shows markers in prehistoric mode at world zoom', () => {
    useMapStore.setState({ atlasMode: 'prehistoric' })
    renderMap(2)
    expect(screen.getAllByTestId('dom-marker').length).toBeGreaterThan(0)
  })
})
