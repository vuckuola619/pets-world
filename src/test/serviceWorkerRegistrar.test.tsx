import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

import ServiceWorkerRegistrar from '../components/ServiceWorkerRegistrar'

interface SwStub {
  register: ReturnType<typeof vi.fn>
  getRegistrations: ReturnType<typeof vi.fn>
}

function stubBrowser({ serviceWorker = true, caches = true } = {}) {
  const sw: SwStub = {
    register: vi.fn(),
    getRegistrations: vi.fn(async () => [
      { unregister: vi.fn(async () => true) },
      { unregister: vi.fn(async () => true) },
    ]),
  }
  const cacheDelete = vi.fn(async () => true)
  Object.defineProperty(navigator, 'serviceWorker', {
    value: serviceWorker ? sw : undefined,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'caches', {
    value: caches ? { keys: async () => ['pets-world-v1', 'pets-world-v2'], delete: cacheDelete } : undefined,
    configurable: true,
  })
  return { sw, cacheDelete }
}

describe('ServiceWorkerRegistrar', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
  })

  it('in dev, unregisters workers and clears caches instead of registering', async () => {
    const { sw, cacheDelete } = stubBrowser()
    render(<ServiceWorkerRegistrar />)
    await vi.waitFor(() => {
      expect(sw.register).not.toHaveBeenCalled()
      expect(sw.getRegistrations).toHaveBeenCalled()
      expect(cacheDelete).toHaveBeenCalledWith('pets-world-v1')
      expect(cacheDelete).toHaveBeenCalledWith('pets-world-v2')
    })
  })

  it('in production, registers the service worker and leaves caches alone', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { sw, cacheDelete } = stubBrowser()
    render(<ServiceWorkerRegistrar />)
    await vi.waitFor(() => {
      expect(sw.register).toHaveBeenCalledWith('/sw.js')
      expect(sw.getRegistrations).not.toHaveBeenCalled()
      expect(cacheDelete).not.toHaveBeenCalled()
    })
  })

  it('does nothing when service workers are unsupported', () => {
    const { sw } = stubBrowser({ serviceWorker: false })
    render(<ServiceWorkerRegistrar />)
    expect(sw.register).not.toHaveBeenCalled()
  })
})
