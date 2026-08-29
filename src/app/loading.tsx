'use client'
import { useMapStore } from '../store/useMapStore'
import { t } from '../lib/i18n'

/** Top-level loading fallback — shimmer skeleton instead of bare text */
export default function Loading(): React.JSX.Element {
  const { locale } = useMapStore()
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="flex w-full max-w-md flex-col items-center gap-4 px-6">
        <div className="skeleton-shimmer h-10 w-10 rounded-xl" aria-hidden />
        <div className="skeleton-shimmer h-3 w-40 rounded-full" aria-hidden />
        <span className="sr-only">{t(locale).loading}</span>
      </div>
    </div>
  )
}
