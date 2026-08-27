import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sw = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8')

describe('service worker offline fallback', () => {
  it('awaits the cache match before falling back', () => {
    expect(sw).toMatch(/async function offlineFallback\(\)/)
    expect(sw).toMatch(/const cached = await caches\.match\('\/'\)/)
  })

  it('never returns a bare promise OR-ed with a Response', () => {
    expect(sw).not.toMatch(/return caches\.match\('\/'\) \|\|/)
  })
})
