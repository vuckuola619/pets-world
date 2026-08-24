import { describe, expect, it } from 'vitest'
import { dinosaurs } from '../data/dinosaurs'
import {
  atlasProfiles,
  getAtlasProfileBySlug,
  getAtlasProfileStaticParams,
} from '../data/atlasProfiles'

describe('atlas full profile data', () => {
  it('includes every dinosaur slug in static profile params', () => {
    const params = getAtlasProfileStaticParams().map((param) => param.slug)

    dinosaurs.forEach((dinosaur) => {
      expect(params).toContain(dinosaur.slug)
    })
  })

  it('builds a full profile for prehistoric records', () => {
    const profile = getAtlasProfileBySlug('tyrannosaurus-rex')

    expect(profile?.atlasMode).toBe('prehistoric')
    expect(profile?.commonName).toBe('Tyrannosaurus rex')
    const imgUrl = profile?.images[0]?.url || '';
    const isSvg = imgUrl.startsWith('data:image/svg+xml');
    const isRealImg = imgUrl.startsWith('https://upload.wikimedia.org/');
    expect(isSvg || isRealImg).toBe(true)
    expect(profile?.images[0]?.credit).toMatch(/Generated paleoart|Wikimedia/)
    expect(profile?.sourceLinks.some((link) => link.href.includes('paleobiodb.org'))).toBe(true)
    expect(profile?.profileFacts.some((fact) => fact.includes('occ:139292'))).toBe(true)
  })

  it('keeps wildlife and dinosaur profiles in one lookup surface', () => {
    expect(atlasProfiles.some((profile) => profile.slug === 'komodo-dragon')).toBe(true)
    expect(atlasProfiles.some((profile) => profile.slug === 'cryolophosaurus-ellioti')).toBe(true)
  })
})
