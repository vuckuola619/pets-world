import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import rawData from '@/data/animals.json'
import { IUCN_CONFIG } from '@/lib/iucn'
import AnimalDetailsClient from './AnimalDetailsClient'

const STATUS_CODE: Record<string, string> = {
  'Critically Endangered': 'CR', 'Endangered': 'EN', 'Vulnerable': 'VU',
  'Near Threatened': 'NT', 'Least Concern': 'LC', 'Data Deficient': 'DD',
}

type AnimalData = typeof rawData[number]

interface Props {
  params: Promise<{ slug: string }>
}

/** Generates static params for all animal pages */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return rawData.map(a => ({ slug: a.slug }))
}

/** Generates metadata for SEO */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const animal = rawData.find(a => a.slug === slug)
  if (!animal) return { title: 'Animal Not Found' }
  const desc = animal.description?.slice(0, 160) || `Learn about the ${animal.commonName} (${animal.scientificName})`
  return {
    title: `${animal.commonName} — World Wildlife Atlas`,
    description: desc,
    openGraph: {
      title: `${animal.commonName} — World Wildlife Atlas`,
      description: desc,
      type: 'article',
    },
  }
}

/** Server-rendered animal detail page with premium Natura design */
export default async function AnimalDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { slug } = await params
  const animal = rawData.find(a => a.slug === slug) as AnimalData | undefined

  if (!animal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--natura-surface)' }}>
        <div className="text-center animate-fade-in-up">
          <span className="text-6xl mb-4 block">🔍</span>
          <h1 className="text-2xl font-bold text-foreground font-[var(--font-heading)]">Animal Not Found</h1>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline transition-colors">
            ← Back to Atlas
          </Link>
        </div>
      </div>
    )
  }

  const iucnCode = animal.iucnStatus || 'LC'
  const iucn = IUCN_CONFIG[iucnCode] || IUCN_CONFIG.LC
  const statusCode = STATUS_CODE[animal.conservationStatus] || animal.iucnStatus || 'LC'

  // Find related species from same region
  const related = rawData
    .filter(a => a.region === animal.region && a.slug !== animal.slug)
    .slice(0, 5)

  return (
    <div className="min-h-screen" style={{ background: 'var(--natura-surface)' }}>
      {/* Sticky back button on mobile */}
      <div className="sticky top-0 z-20 md:hidden glass-header px-4 py-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Atlas
        </Link>
      </div>

      {/* ─── Hero Banner ─── */}
      <div className="relative bg-hero-gradient text-white overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-8 transition-colors duration-200 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
            Back to Atlas
          </Link>

          <div className="flex items-start gap-4 mb-4">
            <span className="text-6xl sm:text-7xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>{animal.emoji}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{animal.flag}</span>
                <span className="text-sm text-white/50">{animal.country}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold font-[var(--font-heading)] leading-tight animate-fade-in-up">
                {animal.commonName}
              </h1>
              <p className="text-base sm:text-lg text-white/60 italic mt-1 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                {animal.scientificName}
              </p>
            </div>
          </div>

          {/* Status badges */}
          <div className="mt-5 flex items-center gap-2.5 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span
              className="px-3.5 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-lg"
              style={{ background: iucn.bg, color: '#fff' }}
            >
              {statusCode} · {iucn.label}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80 backdrop-blur-sm border border-white/10">
              {animal.region}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80 backdrop-blur-sm border border-white/10">
              {animal.classification}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80 backdrop-blur-sm border border-white/10">
              {animal.diet}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <StatCard icon="🏷️" label="Classification" value={animal.classification} />
          <StatCard icon="🍽️" label="Diet" value={animal.diet} />
          <StatCard icon="⏱️" label="Lifespan" value={`${animal.lifespan.min}–${animal.lifespan.max} ${animal.lifespan.unit}`} />
          <StatCard icon="⚖️" label="Weight" value={`${animal.weight.min}–${animal.weight.max} ${animal.weight.unit}`} />
        </div>

        {/* Description */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <SectionTitle color="var(--natura-emerald)">Description</SectionTitle>
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            {animal.description}
          </p>
        </section>

        {/* Habitat */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <SectionTitle color="var(--natura-emerald)">Habitat</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {animal.habitat.map((h, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors duration-200 hover:shadow-sm"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--natura-forest)',
                  borderColor: 'var(--border)',
                }}
              >
                🌿 {h}
              </span>
            ))}
          </div>
        </section>

        {/* API-Ninjas Extended Data (Client Component) */}
        <AnimalDetailsClient animalName={animal.commonName} />

        {/* Taxonomy */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <SectionTitle color="var(--natura-ocean)">Taxonomy</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(animal.taxonomy).map(([key, val]) => (
              <div key={key} className="glass-card rounded-xl px-4 py-3 group hover:shadow-md transition-all duration-200">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{key}</div>
                <div className="text-sm font-medium text-foreground italic mt-0.5 group-hover:text-primary transition-colors">{val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Fun Facts */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <SectionTitle color="var(--natura-amber)">Fun Facts</SectionTitle>
          <div className="space-y-3">
            {animal.funFacts.map((fact, i) => (
              <div
                key={i}
                className="flex gap-3 glass-card rounded-xl px-4 py-3 hover:shadow-md transition-all duration-200"
              >
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white mt-0.5"
                  style={{ background: iucn.bg }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{fact}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Population & Links */}
        <section className="flex items-center gap-3 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <span
            className="px-4 py-2 rounded-full text-sm font-semibold border"
            style={{
              background: 'oklch(0.95 0.04 300 / 50%)',
              color: 'oklch(0.45 0.15 300)',
              borderColor: 'oklch(0.85 0.06 300)',
            }}
          >
            🧬 Population: {animal.population}
          </span>
          {animal.wikiUrl && (
            <a
              href={animal.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border text-primary hover:bg-accent hover:shadow-sm transition-all duration-200"
            >
              📖 Wikipedia →
            </a>
          )}
        </section>

        {/* Related Species */}
        {related.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <SectionTitle color="var(--natura-coral)">Related Species from {animal.region}</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/animal/${r.slug}`}
                  className="glass-card rounded-xl px-3 py-3 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <span className="text-2xl block mb-1">{r.emoji}</span>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors block truncate">{r.commonName}</span>
                  <span className="text-[10px] text-muted-foreground">{r.flag} {r.country}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/** Section title with colored accent bar */
function SectionTitle({ children, color }: { children: React.ReactNode; color: string }): React.JSX.Element {
  return (
    <h2 className="text-lg font-semibold text-foreground font-[var(--font-heading)] mb-3 flex items-center gap-2">
      <span className="w-1 h-5 rounded-full" style={{ background: color }} />
      {children}
    </h2>
  )
}

/** Premium stat card with emoji icon */
function StatCard({ icon, label, value }: { icon: string; label: string; value: string }): React.JSX.Element {
  return (
    <div className="glass-card rounded-xl px-4 py-3 group hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-sm font-semibold text-foreground mt-0.5 group-hover:text-primary transition-colors">{value}</div>
    </div>
  )
}
