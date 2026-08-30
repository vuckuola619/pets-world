"use client"
import React from 'react';

import { X, GitCompareArrows } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "../lib/motion";
import * as Dialog from "@radix-ui/react-dialog";
import type { AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { getAtlasRecords } from "../hooks/useAtlasAnimals";
import { IUCN_CONFIG, statusCodeFor, IUCN_FALLBACK } from "../lib/iucn";
import { useAnimalMedia } from "../hooks/useAnimalMedia";
import IucnDot from "./IucnDot";
import { localDinoThumb } from "../lib/wikiImages";
import { t } from "../lib/i18n";
import { translateCountry, getEntryFunFacts, getQuickHabitat, intervalMap, habitMap } from "../lib/profileText";

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
      <div className="text-micro font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--accent)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: v !== null ? `${(v / max) * 100}%` : '0%' }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              style={{
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
  const code = statusCodeFor(animal.conservationStatus);
  const iucn = IUCN_CONFIG[code as keyof typeof IUCN_CONFIG];
  const { locale } = useMapStore();

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
      <div className="font-semibold text-foreground text-sm font-heading">{animal.animal}</div>
      <div className="text-micro text-muted-foreground italic">{animal.scientificName}</div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <IucnDot code={code} color={iucn?.bg} />
        <span className="text-micro font-bold" style={{ color: iucn?.bg ?? IUCN_FALLBACK }}>{code}</span>
      </div>
      <div className="text-micro text-muted-foreground mt-1">{animal.flag} {translateCountry(animal.country, locale)}</div>
    </div>
  );
}

/** Species comparison panel — floating bottom bar + full modal */
export default function ComparePanel(): React.JSX.Element {
  const { atlasMode, compareIds, compareOpen, setCompareOpen, removeCompare, clearCompare, locale } = useMapStore();
  const tr = t(locale);
  const reduceMotion = useReducedMotion();

  const records = getAtlasRecords(atlasMode);
  const animals = compareIds
    .map((id) => records.find((c) => c.id === id))
    .filter((animal): animal is AnimalEntry => Boolean(animal));

  // Floating bottom bar showing selected species
  return (
    <AnimatePresence>
      {animals.length > 0 && !compareOpen && (
        <motion.div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        >
          <div className="glass-card rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
            <GitCompareArrows size={16} className="text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2">
              <AnimatePresence initial={false}>
                {animals.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--accent)' }}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <span>{a.emoji}</span>
                    <span className="text-foreground max-w-[80px] truncate">{a.animal}</span>
                    <button
                      onClick={() => removeCompare(a.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`${tr.compare.removeFromCompare}: ${a.animal}`}
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setCompareOpen(true)}
              disabled={compareIds.length < 2}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
              }}
            >
              {tr.compare.compare}
            </button>
            <button
              onClick={clearCompare}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={tr.compare.clearAll}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Full comparison modal — Radix Dialog for a11y, motion for enter/exit */
export function CompareModal(): React.JSX.Element {
  const { atlasMode, compareIds, compareOpen, setCompareOpen, clearCompare, locale } = useMapStore();
  const tr = t(locale);
  const reduceMotion = useReducedMotion();

  const records = getAtlasRecords(atlasMode);
  const animals = compareIds
    .map((id) => records.find((c) => c.id === id))
    .filter((animal): animal is AnimalEntry => Boolean(animal));

  return (
    <Dialog.Root open={compareOpen} onOpenChange={setCompareOpen}>
      <AnimatePresence>
        {compareOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border scrollbar-thin outline-none"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              >
                <Dialog.Title className="sr-only">{tr.compare.title}</Dialog.Title>
                <Dialog.Description className="sr-only">{tr.compare.funFacts}</Dialog.Description>

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <GitCompareArrows size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-foreground font-heading">{tr.compare.title}</h2>
                  </div>
                  <button onClick={() => setCompareOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={tr.close}>
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
                        <div className="text-micro font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {tr.detail[field as keyof typeof tr.detail] ?? field}
                        </div>
                        {animals.map((a) => {
                          let displayVal = a[field];
                          if (field === 'classification') {
                            displayVal = tr.classification[a.classification as keyof typeof tr.classification] ?? a.classification;
                          } else if (field === 'diet') {
                            displayVal = tr.diets[a.diet as keyof typeof tr.diets] ?? a.diet;
                          } else if (field === 'region') {
                            displayVal = tr.regions[a.region as keyof typeof tr.regions] ?? a.region;
                          } else if (field === 'habitat') {
                            if (locale === 'id') {
                              displayVal = getQuickHabitat(a);
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
                      label={tr.compare.population}
                      values={animals.map((a) => parsePopulation(a.population))}
                      format={(v) => v.toLocaleString()}
                    />
                  </div>

                  {/* Fun Facts comparison */}
                  <div>
                    <div className="text-micro font-semibold text-muted-foreground uppercase tracking-wider mb-3">{tr.compare.funFacts}</div>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${animals.length}, 1fr)` }}>
                      {animals.map((a) => {
                        const facts = getEntryFunFacts(a, locale);
                        return (
                          <div key={a.id} className="space-y-2">
                            <div className="text-xs font-medium text-foreground flex items-center gap-1">{a.emoji} {a.animal}</div>
                            {facts.slice(0, 3).map((f, i) => (
                              <div key={i} className="text-micro text-muted-foreground leading-relaxed glass-card rounded-lg p-2">
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
                    {tr.compare.clearAll}
                  </button>
                  <button
                    onClick={() => setCompareOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
                    }}
                  >
                    {tr.compare.done}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
