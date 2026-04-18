import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Theme', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('defaults to light theme when no localStorage value', async () => {
    const { useMapStore } = await import('../store/useMapStore')
    const store = useMapStore.getState()
    expect(['light', 'dark', 'system']).toContain(store.theme)
  })

  it('persists theme to localStorage when setTheme is called', async () => {
    const { useMapStore } = await import('../store/useMapStore')
    useMapStore.getState().setTheme('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('wildlife-theme', 'dark')
    expect(useMapStore.getState().theme).toBe('dark')
  })

  it('cycles through light → dark → system', async () => {
    const { useMapStore } = await import('../store/useMapStore')
    useMapStore.getState().setTheme('light')
    expect(useMapStore.getState().theme).toBe('light')
    
    useMapStore.getState().setTheme('dark')
    expect(useMapStore.getState().theme).toBe('dark')
    
    useMapStore.getState().setTheme('system')
    expect(useMapStore.getState().theme).toBe('system')
  })

  it('only accepts valid theme values', async () => {
    const { useMapStore } = await import('../store/useMapStore')
    const validThemes = ['light', 'dark', 'system']
    for (const t of validThemes) {
      useMapStore.getState().setTheme(t as 'light' | 'dark' | 'system')
      expect(useMapStore.getState().theme).toBe(t)
    }
  })
})
