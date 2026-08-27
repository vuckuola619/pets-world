'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker for PWA support.
 *
 * In dev the SW must stay away: dev chunk URLs are un-hashed, so a
 * cache-first SW keeps serving bundles from older sessions and breaks
 * hydration with mixed modules. Unregister and drop its caches instead.
 */
export default function ServiceWorkerRegistrar(): React.ReactElement | null {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker) return

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister()
      })
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) void caches.delete(key)
        })
      }
      return
    }

    navigator.serviceWorker.register('/sw.js')
  }, [])
  return null
}
