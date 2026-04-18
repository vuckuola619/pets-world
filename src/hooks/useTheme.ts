'use client'

import { useEffect, useCallback } from 'react'
import { useMapStore } from '../store/useMapStore'

/** Applies the current theme class and meta color to the document */
function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  root.classList.toggle('dark', isDark)

  // Update theme-color meta tag
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? '#0f1a14' : '#1a3a2a')
  }
}

/** Theme management hook with localStorage persistence and system preference detection */
export function useTheme() {
  const theme = useMapStore((s) => s.theme)
  const setTheme = useMapStore((s) => s.setTheme)

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }, [theme, setTheme])

  const isDark =
    typeof window !== 'undefined'
      ? theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : false

  return { theme, setTheme, toggleTheme, isDark }
}
