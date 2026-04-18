'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'wildlife-favorites'

/** Reads favorites from localStorage */
function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Writes favorites to localStorage */
function writeFavorites(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/** Hook for managing favorite species with localStorage persistence */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  // Load favorites from localStorage on mount
  useEffect(() => {
    setFavorites(readFavorites())
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      writeFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  )

  const clearFavorites = useCallback(() => {
    setFavorites([])
    writeFavorites([])
  }, [])

  return { favorites, toggleFavorite, isFavorite, clearFavorites }
}
