import { describe, it, expect } from 'vitest'
import { translations } from '../lib/i18n'

type AnyRecord = Record<string, unknown>

function keyPaths(obj: AnyRecord, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    return v && typeof v === 'object' ? keyPaths(v as AnyRecord, path) : [path]
  })
}

describe('i18n locale parity', () => {
  it('en has exactly the same key paths as id', () => {
    const idKeys = keyPaths(translations.id as AnyRecord).sort()
    const enKeys = keyPaths(translations.en as AnyRecord).sort()
    expect(enKeys).toEqual(idKeys)
  })

  it('no leaf value is empty in either locale', () => {
    for (const block of [translations.id, translations.en] as AnyRecord[]) {
      for (const path of keyPaths(block)) {
        const value = path
          .split('.')
          .reduce<unknown>((acc, k) => (acc as AnyRecord)[k], block)
        expect(String(value).length, path).toBeGreaterThan(0)
      }
    }
  })
})
