'use client'

import React from 'react'
import Link from 'next/link'
import { Database, Leaf, Landmark, Image as ImageIcon, FlaskConical, ExternalLink, ArrowLeft } from 'lucide-react'
import { t } from '@/lib/i18n'
import { useMapStore } from '@/store/useMapStore'
import { countries } from '@/data/countries'
import { dinosaurs } from '@/data/dinosaurs'

const SOURCES = [
  { key: 'sourcePbdb', icon: Database, href: 'https://paleobiodb.org/', label: 'Paleobiology Database' },
  { key: 'sourceIucn', icon: Leaf, href: 'https://www.iucnredlist.org/', label: 'IUCN Red List' },
  { key: 'sourceWiki', icon: Landmark, href: 'https://commons.wikimedia.org/', label: 'Wikimedia Commons' },
  { key: 'sourceNasa', icon: ImageIcon, href: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/' , label: 'NASA Blue Marble' },
] as const

/** Bilingual "About & data sources" view — relaxed, educational tone. */
export default function AboutView(): React.JSX.Element {
  const locale = useMapStore((s) => s.locale)
  const tr = t(locale).about

  return (
    <main
      className="h-screen overflow-y-auto"
      style={{ background: 'var(--natura-surface)' }}
    >
      <div className="mx-auto w-full max-w-2xl px-5 py-10 text-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/60 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-background"
        >
          <ArrowLeft size={14} aria-hidden /> {tr.backToMap}
        </Link>

        <h1 className="mt-8 font-[var(--font-heading)] text-4xl font-bold">{tr.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{tr.tagline}</p>
        <p className="mt-5 leading-relaxed text-foreground/90">{tr.intro}</p>

        {/* Atlas contents */}
        <section className="mt-10" aria-labelledby="about-stats">
          <h2 id="about-stats" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tr.stats}
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { n: countries.length, label: tr.speciesCount },
              { n: dinosaurs.length, label: tr.taxaCount },
              { n: 9, label: tr.regionCount },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-2xl px-4 py-5 text-center">
                <div className="font-[var(--font-heading)] text-3xl font-bold text-primary">{s.n}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Data sources */}
        <section className="mt-10" aria-labelledby="about-sources">
          <h2 id="about-sources" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tr.sourcesTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{tr.sourcesIntro}</p>
          <ul className="mt-4 space-y-3">
            {SOURCES.map((s) => (
              <li key={s.key}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card group flex items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-accent"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon size={17} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold group-hover:text-primary transition-colors">
                      {s.label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                      {tr[s.key]}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Verify + repo */}
        <section className="mt-10 grid gap-3 sm:grid-cols-2" aria-label={tr.verifyTitle}>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical size={15} className="text-primary" aria-hidden /> {tr.verifyTitle}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr.verifyDesc}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ExternalLink size={15} className="text-primary" aria-hidden /> {tr.repoTitle}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr.repoDesc}</p>
            <a
              href="https://github.com/vuckuola619/pets-world"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
            >
              {tr.repoLink} →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
