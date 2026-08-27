'use client'

import { useCallback } from 'react'
import { useMapStore } from '../store/useMapStore'

/**
 * Selector hook over the shared favorites slice in useMapStore.
 * All surfaces (sidebar, map popup, mobile panel) read the same state —
 * a toggle anywhere is visible everywhere, and persistence is write-through
 * to localStorage inside the store actions.
 */
export function useFavorites() {
  const favorites = useMapStore((s) => s.favorites)
  const toggleFavoriteStore = useMapStore((s) => s.toggleFavorite)
  const clearFavoritesStore = useMapStore((s) => s.clearFavorites)

  const toggleFavorite = useCallback(
    (id: string) => {
      toggleFavoriteStore(id)
    },
    [toggleFavoriteStore]
  )

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  const clearFavorites = useCallback(() => {
    clearFavoritesStore()
  }, [clearFavoritesStore])

  return { favorites, toggleFavorite, isFavorite, clearFavorites }
}
