'use client'

import { useEffect, useCallback, useState } from 'react'
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
  const themeState = useMapStore((s) => s.theme)
  const setTheme = useMapStore((s) => s.setTheme)
  // Lazy init: hydration happens in one render, no cascading effect needed.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(themeState)
  }, [themeState])

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (themeState !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeState])

  const toggleTheme = useCallback(() => {
    // One-shot color glide so the switch doesn't snap; removed after 350ms.
    const root = document.documentElement
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 350)
    const next = themeState === 'light' ? 'dark' : themeState === 'dark' ? 'system' : 'light'
    setTheme(next)
  }, [themeState, setTheme])

  const isDark =
    mounted && typeof window !== 'undefined'
      ? themeState === 'dark' ||
        (themeState === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : false

  const theme = mounted ? themeState : 'light'

  return { theme, setTheme, toggleTheme, isDark, mounted }
}
