'use client'
import { useMapStore } from '../store/useMapStore'
import { t } from '../lib/i18n'

/** Global error boundary — Natura-themed fallback with a retry action */
export default function Error({ error, reset }: { error: Error; reset: () => void }): React.JSX.Element {
  const { locale } = useMapStore()
  const tr = t(locale)
  return (
    <div className="flex items-center justify-center min-h-screen px-6" style={{ background: 'var(--natura-surface)' }}>
      <div className="glass-card rounded-2xl shadow-xl p-8 max-w-md text-center animate-fade-in-scale">
        <div className="font-heading text-5xl font-bold" style={{ color: 'var(--natura-coral)' }} aria-hidden>
          !
        </div>
        <h2 className="font-heading text-xl font-semibold text-foreground mt-3">{tr.error}</h2>
        <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))' }}
        >
          {tr.tryAgain}
        </button>
      </div>
    </div>
  )
}
