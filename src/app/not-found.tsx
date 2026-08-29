import Link from 'next/link'

/** Custom 404 — matches the Natura look instead of the default Next page */
export default function NotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'var(--natura-surface)' }}>
      <div className="font-heading text-6xl font-bold" style={{ color: 'var(--natura-emerald)' }}>
        404
      </div>
      <h1 className="font-heading text-xl font-semibold text-foreground">This page wandered off the map</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        The page you are looking for does not exist. Head back to the atlas and explore the globe instead.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
        style={{ background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))' }}
      >
        ← Back to the atlas
      </Link>
    </main>
  )
}
