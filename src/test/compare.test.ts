import { describe, it, expect, beforeEach } from 'vitest'
import { useMapStore } from '../store/useMapStore'

describe('Compare feature', () => {
  beforeEach(() => {
    useMapStore.setState({ compareIds: [], compareOpen: false })
  })

  it('starts with empty compareIds', () => {
    expect(useMapStore.getState().compareIds).toEqual([])
    expect(useMapStore.getState().compareOpen).toBe(false)
  })

  it('adds a species to compare', () => {
    useMapStore.getState().addCompare('tiger-1')
    expect(useMapStore.getState().compareIds).toEqual(['tiger-1'])
  })

  it('does not add duplicate species', () => {
    useMapStore.getState().addCompare('tiger-1')
    useMapStore.getState().addCompare('tiger-1')
    expect(useMapStore.getState().compareIds).toEqual(['tiger-1'])
  })

  it('enforces max 3 species limit', () => {
    useMapStore.getState().addCompare('id-1')
    useMapStore.getState().addCompare('id-2')
    useMapStore.getState().addCompare('id-3')
    useMapStore.getState().addCompare('id-4')
    expect(useMapStore.getState().compareIds).toHaveLength(3)
    expect(useMapStore.getState().compareIds).toEqual(['id-1', 'id-2', 'id-3'])
  })

  it('removes a species from compare', () => {
    useMapStore.getState().addCompare('id-1')
    useMapStore.getState().addCompare('id-2')
    useMapStore.getState().removeCompare('id-1')
    expect(useMapStore.getState().compareIds).toEqual(['id-2'])
  })

  it('clears all compare and closes panel', () => {
    useMapStore.getState().addCompare('id-1')
    useMapStore.getState().addCompare('id-2')
    useMapStore.getState().setCompareOpen(true)
    useMapStore.getState().clearCompare()
    expect(useMapStore.getState().compareIds).toEqual([])
    expect(useMapStore.getState().compareOpen).toBe(false)
  })

  it('can open and close compare panel', () => {
    useMapStore.getState().setCompareOpen(true)
    expect(useMapStore.getState().compareOpen).toBe(true)
    useMapStore.getState().setCompareOpen(false)
    expect(useMapStore.getState().compareOpen).toBe(false)
  })

  it('removing non-existent ID does not crash', () => {
    useMapStore.getState().addCompare('id-1')
    useMapStore.getState().removeCompare('non-existent')
    expect(useMapStore.getState().compareIds).toEqual(['id-1'])
  })
})
