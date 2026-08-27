"use client"
import React from 'react';

import { X, GitCompareArrows } from "lucide-react";
import type { AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { getAtlasRecords } from "../hooks/useAtlasAnimals";
import { IUCN_CONFIG, STATUS_CODE } from "../lib/iucn";
import { useAnimalMedia } from "../hooks/useAnimalMedia";
import { localDinoThumb } from "../lib/wikiImages";
import { t } from "../lib/i18n";
import { getAtlasProfileBySlug, translateCountry, getProfileFunFacts, intervalMap, habitMap } from "../data/atlasProfiles";

/** Extracts a numeric value from a population string for comparison */
function parsePopulation(pop: string): number | null {
  const match = pop.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** Comparison stat row with proportional bars */
function CompareBar({ label, values, unit, format }: {
  label: string;
  values: (number | null)[];
  unit?: string;
  format?: (v: number) => string;
}): React.JSX.Element {
  const max = Math.max(...values.filter((v): v is number => v !== null), 1);
  const colors = ['var(--natura-emerald)', 'var(--natura-ocean)', 'var(--natura-coral)'];
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--accent)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: v !== null ? `${(v / max) * 100}%` : '0%',
                background: colors[i],
                minWidth: v !== null ? '8px' : '0',
              }}
            />
          </div>
          <span className="text-xs text-foreground font-medium w-20 text-right tabular-nums">
            {v !== null ? (format ? format(v) : `${v} ${unit ?? ''}`) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function CompareAnimalHeader({ animal }: { animal: AnimalEntry }): React.JSX.Element {
  const { imageUrl, imageLoading } = useAnimalMedia(animal.animal, animal.wikiUrl, animal.imageUrl);
  const [hasError, setHasError] = React.useState(false);
  const code = STATUS_CODE[animal.conservationStatus as keyof typeof STATUS_CODE] || 'LC';
  const iucn = IUCN_CONFIG[code as keyof typeof IUCN_CONFIG];
  const { locale } = useMapStore();
  const profile = getAtlasProfileBySlug(animal.slug) ?? null;

  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--accent)' }}>
        {imageLoading || (!imageUrl || hasError) ? (
          <span className="text-4xl block">{animal.emoji}</span>
        ) : (
          <img
            src={animal.imageKind === 'photo' ? localDinoThumb(animal.slug, 128) : imageUrl}
            alt={animal.animal}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      <div className="font-semibold text-foreground text-sm font-[var(--font-heading)]">{animal.animal}</div>
      <div className="text-[11px] text-muted-foreground italic">{animal.scientificName}</div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: iucn?.bg ?? '#888' }} />
        <span className="text-[10px] font-bold" style={{ color: iucn?.bg ?? '#888' }}>{code}</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{animal.flag} {profile ? translateCountry(profile.country, locale) : animal.country}</div>
    </div>
  );
}

/** Species comparison panel — floating bottom bar + full modal */
export default function ComparePanel(): React.JSX.Element | null {
  const { atlasMode, compareIds, compareOpen, setCompareOpen, removeCompare, clearCompare, locale } = useMapStore();
  const tr = t(locale);

  if (compareIds.length === 0) return null;

  const records = getAtlasRecords(atlasMode);
  const animals = compareIds
    .map((id) => records.find((c) => c.id === id))
    .filter((animal): animal is AnimalEntry => Boolean(animal));

  // Floating bottom bar showing selected species
  if (!compareOpen) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 animate-fade-in-up">
        <div className="glass-card rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <GitCompareArrows size={16} className="text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2">
            {animals.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--accent)' }}>
                <span>{a.emoji}</span>
                <span className="text-foreground max-w-[80px] truncate">{a.animal}</span>
                <button
                  onClick={() => removeCompare(a.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Remove ${a.animal} from comparison`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCompareOpen(true)}
            disabled={compareIds.length < 2}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
            }}
          >
            Compare
          </button>
          <button
            onClick={clearCompare}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear comparison"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Full comparison modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCompareOpen(false)} />
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border scrollbar-thin" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <GitCompareArrows size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground font-[var(--font-heading)]">Species Comparison</h2>
          </div>
          <button onClick={() => setCompareOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close comparison">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Species headers */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${animals.length}, 1fr)` }}>
            {animals.map((a) => (
              <CompareAnimalHeader key={a.id} animal={a} />
            ))}
          </div>

          {/* Quick info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['classification', 'diet', 'region', 'habitat'] as const).map((field) => (
              <div key={field} className="glass-card rounded-xl p-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {tr.detail[field as keyof typeof tr.detail] ?? field}
                </div>
                {animals.map((a) => {
                  const profile = getAtlasProfileBySlug(a.slug) ?? null;
                  let displayVal = a[field];
                  if (field === 'classification') {
                    displayVal = tr.classification[a.classification as keyof typeof tr.classification] ?? a.classification;
                  } else if (field === 'diet') {
                    displayVal = tr.diets[a.diet as keyof typeof tr.diets] ?? a.diet;
                  } else if (field === 'region') {
                    displayVal = tr.regions[a.region as keyof typeof tr.regions] ?? a.region;
                  } else if (field === 'habitat') {
                    if (locale === 'id' && profile?.atlasMode === 'prehistoric' && profile.fossil) {
                      const fossil = profile.fossil;
                      const intervalName = intervalMap[fossil.interval] || fossil.interval;
                      displayVal = `Formasi ${fossil.formation}, ${fossil.locality}, ${intervalName}`;
                    }
                  }
                  return (
                    <div key={a.id} className="text-xs text-foreground flex items-center gap-1.5 mb-1">
                      <span>{a.emoji}</span>
                      <span className="truncate" title={displayVal}>{field === 'habitat' ? displayVal.slice(0, 30) : displayVal}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Comparison bars */}
          <div className="space-y-4">
            <CompareBar
              label="Population"
              values={animals.map((a) => parsePopulation(a.population))}
              format={(v) => v.toLocaleString()}
            />
          </div>

          {/* Fun Facts comparison */}
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{tr.compare.funFacts}</div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${animals.length}, 1fr)` }}>
              {animals.map((a) => {
                const profile = getAtlasProfileBySlug(a.slug) ?? null;
                const facts = profile ? getProfileFunFacts(profile, locale) : a.funFacts;
                return (
                  <div key={a.id} className="space-y-2">
                    <div className="text-xs font-medium text-foreground flex items-center gap-1">{a.emoji} {a.animal}</div>
                    {facts.slice(0, 3).map((f, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground leading-relaxed glass-card rounded-lg p-2">
                        {f}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-3 border-t flex items-center justify-between" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <button onClick={clearCompare} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear All
          </button>
          <button
            onClick={() => setCompareOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
