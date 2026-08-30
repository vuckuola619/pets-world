'use client';
import React, { useCallback, useState } from 'react'
import Link from 'next/link'
import { Heart, Share2 } from 'lucide-react'
import { IUCN_CONFIG, STATUS_CODE } from '@/lib/iucn'
import AnimalDetailsClient from './AnimalDetailsClient'
import PopulationChart from '@/components/PopulationChart'
import GeologicTimeBar from '@/components/GeologicTimeBar'
import { localDinoThumb } from '@/lib/wikiImages'
import { useFavorites } from '@/hooks/useFavorites'
import { useMapStore } from "@/store/useMapStore";
import { useToastStore } from "@/store/useToastStore";
import {
  type AtlasProfile,
  countryMap,
  intervalMap,
  habitMap,
  getProfileFunFacts,
  getProfileDescription
} from "@/lib/profileText";
import { t, type TranslationStrings } from '@/lib/i18n';

function SectionTitle({ children, color }: { children: React.ReactNode; color: string }): React.JSX.Element {
  return (
    <h2 className="text-lg font-semibold text-foreground font-[var(--font-heading)] mb-3 flex items-center gap-2">
      <span className="w-1 h-5 rounded-full" style={{ background: color }} />
      {children}
    </h2>
  )
}

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

export default function AnimalProfileView({ animal }: { animal: AtlasProfile }): React.JSX.Element {
  const locale = useMapStore(s => s.locale);
  const isPrehistoric = animal.atlasMode === 'prehistoric';
  const { isFavorite, toggleFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);
  const tr = t(locale);
  const isFav = isFavorite(animal.slug);

  // 1. Description Translation
  const description = getProfileDescription(animal, locale);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const data: ShareData = {
      title: `${animal.commonName} — World Wildlife Atlas`,
      text: description.slice(0, 140),
      url,
    };
    if (typeof navigator.share === 'function') {
      try { await navigator.share(data); } catch { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      useToastStore.getState().pushToast('linkCopied');
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }, [animal.commonName, description]);

  // 2. Diet Translation
  const dietKey = animal.diet;
  const diet = t(locale).diets[dietKey as keyof TranslationStrings['diets']] || dietKey;

  // 3. Fun Facts Translation
  const funFacts = getProfileFunFacts(animal, locale);

  // 4. Habitat Translation
  let habitat = animal.habitat;
  if (locale === 'id' && isPrehistoric && animal.fossil) {
    const fossil = animal.fossil;
    const intervalName = intervalMap[fossil.interval] || fossil.interval;
    const habitName = habitMap[fossil.lifeHabit] || fossil.lifeHabit;
    habitat = [
      `Formasi ${fossil.formation}`,
      fossil.locality,
      `${intervalName} (${fossil.earlyAgeMa}-${fossil.lateAgeMa} juta tahun lalu)`,
      habitName.charAt(0).toUpperCase() + habitName.slice(1)
    ];
  }

  // 5. Population Translation
  let population = animal.population;
  if (locale === 'id' && isPrehistoric && animal.fossil) {
    population = `Takson fosil punah; temuan PBDB ${animal.fossil.pbdbOccurrenceId}`;
  }

  // 6. Region Translation
  const region = t(locale).regions[animal.region as keyof TranslationStrings['regions']] || animal.region;

  // 7. Classification Translation
  const classification = t(locale).classification[animal.classification as keyof TranslationStrings['classification']] || animal.classification;

  // 8. Lifespan and Weight Units Translation
  const lifespanUnit = locale === 'id'
    ? (animal.lifespan?.unit === 'years' ? 'tahun' : animal.lifespan?.unit === 'months' ? 'bulan' : animal.lifespan?.unit)
    : animal.lifespan?.unit;
  const lifespanValue = animal.lifespan ? `${animal.lifespan.min}–${animal.lifespan.max} ${lifespanUnit}` : '';

  const weightUnit = locale === 'id'
    ? (animal.weight?.unit === 'lbs' ? 'pon' : animal.weight?.unit)
    : animal.weight?.unit;
  const weightValue = animal.weight ? `${animal.weight.min}–${animal.weight.max} ${weightUnit}` : '';

  const statusCode = STATUS_CODE[animal.conservationStatus] || 'NE'
  const iucn = IUCN_CONFIG[statusCode] || IUCN_CONFIG['NE']

  return (
    <main className={`h-screen overflow-y-auto text-foreground ${isPrehistoric ? 'prehistoric-atlas' : ''}`} style={{ background: 'var(--natura-surface)' }}>
      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0">
          {animal.modelUrl ? (
            <iframe
              title={animal.commonName}
              src={animal.modelUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
            />
          ) : animal.videoUrl ? (
            <video
              src={animal.videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : animal.images[0]?.url ? (
            <img
              src={isPrehistoric ? localDinoThumb(animal.slug, 960) : animal.images[0].url}
              alt={animal.images[0].alt || animal.commonName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-8xl opacity-50 drop-shadow-lg">{animal.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--natura-surface)] via-[var(--natura-surface)]/80 to-transparent pointer-events-none" />
          {isPrehistoric && animal.images[0]?.url ? (
            <a
              href={animal.images[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-3 text-[10px] text-white/75 bg-black/35 backdrop-blur-sm px-2 py-0.5 rounded-full hover:text-white hover:bg-black/50 transition-colors"
              title="View full resolution"
            >
              ⤢ {animal.images[0].credit || 'Wikipedia / Wikimedia Commons'}
            </a>
          ) : animal.images[0]?.credit ? (
            <span className="absolute bottom-2 right-3 text-[10px] text-white/75 bg-black/35 backdrop-blur-sm px-2 py-0.5 rounded-full pointer-events-none select-none">
              {animal.images[0].credit}
            </span>
          ) : null}
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-md border border-foreground/10 text-sm font-medium text-foreground transition-colors mb-6"
          >
            ← {t(locale).detail.backToMap}
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl drop-shadow-md">{animal.emoji}</span>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground drop-shadow-md font-[var(--font-heading)]">
                {animal.commonName}
              </h1>
              <p className="text-lg text-foreground/80 font-medium italic mt-1 drop-shadow-sm">
                {animal.scientificName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <span
              className="px-3 py-1 rounded-full text-sm font-bold shadow-sm"
              style={{ background: iucn.bg, color: 'white' }}
            >
              {statusCode} · {t(locale).iucn[statusCode as keyof TranslationStrings['iucn']] || iucn.label}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-foreground/10 text-foreground/80 backdrop-blur-sm border border-foreground/10">
              {region}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-foreground/10 text-foreground/80 backdrop-blur-sm border border-foreground/10">
              {classification}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-foreground/10 text-foreground/80 backdrop-blur-sm border border-foreground/10">
              {diet}
            </span>

            {/* Favorite + share (right-aligned on wide screens) */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => toggleFavorite(animal.slug)}
                className={`press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border backdrop-blur-sm transition-colors ${
                  isFav
                    ? 'bg-red-500/15 text-red-500 border-red-500/30'
                    : 'bg-background/50 text-foreground/80 border-foreground/10 hover:bg-background'
                }`}
                aria-label={isFav ? tr.favorites.removeFromFavorites : tr.favorites.addToFavorites}
              >
                <Heart size={15} className={isFav ? 'heart-pop' : ''} fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? tr.favorites.removeFromFavorites : tr.favorites.addToFavorites}
              </button>
              <button
                onClick={handleShare}
                className="press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background/50 text-foreground/80 border border-foreground/10 backdrop-blur-sm hover:bg-background transition-colors"
                aria-label={tr.favorites.share}
              >
                <Share2 size={15} aria-hidden />
                {copied ? tr.favorites.shareCopied : tr.favorites.share}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <StatCard icon="🏷️" label={t(locale).detail.classification} value={classification} />
          <StatCard icon="🍽️" label={t(locale).detail.diet} value={diet} />
          {animal.lifespan && animal.lifespan.max > 0 && <StatCard icon="⏱️" label={t(locale).detail.lifespan} value={lifespanValue} />}
          {animal.weight && animal.weight.max > 0 && <StatCard icon="⚖️" label={t(locale).detail.weight} value={weightValue} />}
        </div>

        {/* Population Trend Chart */}
        {!isPrehistoric && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
            <PopulationChart slug={animal.slug} conservationStatus={animal.conservationStatus} width={320} height={80} />
          </section>
        )}

        {/* Geologic timeline (dinosaurs) */}
        {isPrehistoric && animal.fossil && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
            <GeologicTimeBar fossil={animal.fossil} width={320} />
          </section>
        )}

        <section className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <SectionTitle color="var(--natura-emerald)">{t(locale).detail.description}</SectionTitle>
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            {description}
          </p>
        </section>

        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <SectionTitle color="var(--natura-emerald)">{t(locale).detail.habitat}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {habitat && (typeof habitat === 'string' ? [habitat] : habitat).map((h, i) => (
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

        {animal.fossilDistribution && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.22s' }}>
            <SectionTitle color="var(--natura-emerald)">
              {t(locale).detail.fossilDistribution}
            </SectionTitle>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              {locale === 'id' ? (animal.fossilDistribution_id || animal.fossilDistribution) : animal.fossilDistribution}
            </p>
          </section>
        )}

        {!isPrehistoric && <AnimalDetailsClient animalName={animal.commonName} />}

        {animal.taxonomy && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <SectionTitle color="var(--natura-ocean)">{t(locale).detail.taxonomy}</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(animal.taxonomy).map(([key, val]) => (
                <div key={key} className="glass-card rounded-xl px-4 py-3 group hover:shadow-md transition-all duration-200">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t(locale).detail[key as keyof TranslationStrings['detail']] || key}
                  </div>
                  <div className="text-sm font-medium text-foreground italic mt-0.5 group-hover:text-primary transition-colors">{val as string}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {funFacts && funFacts.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <SectionTitle color="var(--natura-amber)">{t(locale).detail.funFacts}</SectionTitle>
            <div className="space-y-3">
              {funFacts.map((fact, i) => (
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
        )}

        <section className="flex items-center gap-3 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <span
            className="px-4 py-2 rounded-full text-sm font-semibold border"
            style={{
              background: 'oklch(0.95 0.04 300 / 50%)',
              color: 'oklch(0.45 0.15 300)',
              borderColor: 'oklch(0.85 0.06 300)',
            }}
          >
            🧬 {t(locale).details.population}: {population}
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
      </div>
    </main>
  )
}

