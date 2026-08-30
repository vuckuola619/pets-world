"use client"
import React from 'react';

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { X, Volume2, GitCompareArrows, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type AnimalEntry } from "../data/countries";
import type { DinosaurAnimalEntry } from "../data/dinosaurs";
import { useMapStore } from "../store/useMapStore";
import { getAtlasRecords } from "../hooks/useAtlasAnimals";
import { useAnimalMedia } from "../hooks/useAnimalMedia";
import { localDinoThumb } from "../lib/wikiImages";
import { audioService } from "./AudioService";
import HeartButton from "./HeartButton";
import { t } from "../lib/i18n";
import { IUCN_CONFIG, STATUS_CODE } from "../lib/iucn";
import { translateCountry, getEntryFunFacts } from "../lib/profileText";

import { CONTINENT_COLORS } from "../lib/regions";

function getDinosaurRecord(entry: AnimalEntry | null) {
  return entry && 'dinosaur' in entry ? (entry as DinosaurAnimalEntry).dinosaur : null;
}

const SHEET_SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;

/** Premium mobile detail sheet with glassmorphism.
 *  Radix Dialog owns a11y (focus trap, Escape, aria); motion owns the
 *  slide-up/down and the drag-to-dismiss gesture from the grabber. */
export default function MobileDetailPanel(): React.JSX.Element {
  const { atlasMode, selectedId, setSelectedId, locale, compareIds, addCompare, removeCompare } = useMapStore();
  const tr = t(locale);
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const isPrehistoric = atlasMode === 'prehistoric';
  // The sheet shares `selectedId` with the desktop popup. On desktop the sheet
  // is only hidden via CSS — an open-but-invisible Radix Dialog still runs its
  // dismiss-on-interact-outside behavior, so ANY later pointer-down (sidebar
  // row, next marker) cleared the selection, unmounted the popup, and replayed
  // its fade. Only mount the dialog on real mobile viewports.
  const [isMobileViewport, setIsMobileViewport] = useState(true);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return; // jsdom/test envs
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const selected = selectedId ? getAtlasRecords(atlasMode).find((c) => c.id === selectedId) ?? null : null;
  const [isPlaying, setIsPlaying] = useState(false);

  // No last-value tracking needed: when `selected` becomes null,
  // AnimatePresence replays the cached element tree (with the previous
  // animal's data baked in) while the exit animation runs.
  const animal = selected;
  const { imageUrl, imageLoading } = useAnimalMedia(animal?.animal ?? null, animal?.wikiUrl, animal?.imageUrl);
  const [hasImgError, setHasImgError] = useState(false);

  const playSound = () => {
    if (!selected) return;
    setIsPlaying(true);
    audioService.playAnimalRepresentativeSound(selected.animal, selected.classification);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const dismiss = () => setSelectedId(null);

  const onDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 120 || info.velocity.y > 400) dismiss();
  };

  return (
    <Dialog.Root open={!!selected && isMobileViewport} onOpenChange={(open) => { if (!open) dismiss(); }}>
      <AnimatePresence>
        {selected && isMobileViewport && (() => {
          const animal = selected;
          const color = CONTINENT_COLORS[animal.region] || "#6366f1";
          const iucnCode = STATUS_CODE[animal.conservationStatus] || 'LC';
          const iucnBg = IUCN_CONFIG[iucnCode]?.bg ?? '#888';
          const isInCompare = compareIds.includes(animal.id);
          const selectedDinosaur = getDinosaurRecord(animal);
          return (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={dismiss}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-label={animal.animal}>
              <motion.div
                className="fixed inset-x-0 bottom-0 z-30 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border-t outline-none md:hidden"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                initial={reduceMotion ? { y: 0, opacity: 0 } : { y: '100%' }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
                transition={SHEET_SPRING}
                drag={reduceMotion ? false : 'y'}
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.6 }}
                onDragEnd={onDragEnd}
              >
                <Dialog.Title className="sr-only">{animal.animal}</Dialog.Title>
                <Dialog.Description className="sr-only">{animal.scientificName}</Dialog.Description>

                {/* Grabber — drag down to dismiss */}
                <div
                  className="cursor-grab touch-none py-2 active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border)' }} />
                </div>

                {/* Close button */}
                <button
                  onClick={dismiss}
                  className="absolute top-3 right-3 z-20 w-12 h-12 flex items-center justify-center rounded-full shadow-lg border-2 transition-all active:scale-95"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                  }}
                  aria-label={tr.close}
                >
                  <X size={22} className="text-muted-foreground" />
                </button>

                <div className="overflow-y-auto p-4 pt-2 scrollbar-thin" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
                  {/* Image */}
                  <div className="w-full rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '16/9', maxHeight: 240, background: 'var(--accent)' }}>
                    {imageLoading || (!imageUrl || hasImgError) ? (
                      <div className="flex items-center justify-center w-full h-full" style={{ background: 'var(--accent)' }}>
                        <span className="text-6xl">{animal.emoji}</span>
                      </div>
                    ) : (
                      <Image
                        src={isPrehistoric && animal.imageKind === 'photo' ? localDinoThumb(animal.slug, 480) : imageUrl}
                        alt={animal.animal}
                        className="w-full object-cover h-full"
                        width={400}
                        height={240}
                        style={{ maxHeight: 240 }}
                        onError={() => setHasImgError(true)}
                        unoptimized
                      />
                    )}
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-lg">{animal.flag}</span>
                    <span className="font-semibold">{translateCountry(animal.country, locale)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-2xl">{animal.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground font-[var(--font-heading)]">{animal.animal}</div>
                      <div className="text-xs text-muted-foreground italic">{animal.scientificName}</div>
                    </div>
                    {/* Action buttons */}
                    <HeartButton animalId={animal.id} animalName={animal.animal} />
                    <button
                      onClick={() => isInCompare ? removeCompare(animal.id) : addCompare(animal.id)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isInCompare ? "text-primary" : "text-muted-foreground"}`}
                      style={{ background: 'var(--accent)' }}
                      aria-label={isInCompare ? tr.compare.removeFromCompare : tr.compare.addToCompare}
                    >
                      <GitCompareArrows size={18} />
                    </button>
                    {!isPrehistoric && (
                      <button
                        onClick={playSound}
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: 'var(--accent)' }}
                        aria-label={isPlaying ? tr.details.stopSound : tr.details.playSound}
                      >
                        {isPlaying ? (
                          <Volume2 size={20} className="animate-pulse" style={{ color: 'var(--natura-ocean)' }} />
                        ) : (
                          <Volume2 size={20} className="text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <div className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--accent)', color: 'var(--natura-emerald)' }}>
                      {tr.classification[animal.classification as keyof typeof tr.classification] ?? animal.classification}
                    </div>
                    <div
                      className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                      style={{
                        background: `${iucnBg}20`,
                        color: iucnBg,
                      }}
                    >
                      {iucnCode} · {tr.conservation[animal.conservationStatus as keyof typeof tr.conservation] ?? animal.conservationStatus}
                    </div>
                    <div className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: `${color}15`, color }}>
                      {tr.regions[animal.region as keyof typeof tr.regions] ?? animal.region}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="glass-card rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase font-semibold">Pop.</div>
                      <div className="text-xs font-medium text-foreground">{animal.population}</div>
                    </div>
                    <div className="glass-card rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase font-semibold">Diet</div>
                      <div className="text-xs font-medium text-foreground">{animal.diet}</div>
                    </div>
                    <div className="glass-card rounded-lg px-2.5 py-2 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase font-semibold">Class</div>
                      <div className="text-xs font-medium text-foreground">{animal.classification}</div>
                    </div>
                  </div>

                  {/* Fun facts */}
                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
                    {getEntryFunFacts(animal, locale).slice(0, 3).map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                          style={{ background: iucnBg }}
                        >
                          {i + 1}
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {animal.wikiUrl && (
                    <a
                      href={animal.wikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <BookOpen size={12} aria-hidden /> Wikipedia Reference
                    </a>
                  )}

                  {selectedDinosaur && (
                    <div className="mt-4 rounded-xl border px-3 py-3 text-xs leading-relaxed" style={{ borderColor: 'rgba(146, 91, 30, 0.28)', background: 'rgba(146, 91, 30, 0.10)' }}>
                      <div className="font-bold text-foreground">PBDB fossil evidence</div>
                      <div className="mt-1 text-muted-foreground">{selectedDinosaur.evidenceNote}</div>
                      <a
                        href={selectedDinosaur.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline"
                      >
                        Verify occurrence {selectedDinosaur.pbdbOccurrenceId}
                      </a>
                    </div>
                  )}

                  {(
                    <Link
                      href={`/animal/${animal.slug}`}
                      prefetch={false}
                      className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:shadow-lg active:scale-98"
                      style={{
                        background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
                      }}
                    >
                      Explore Full Profile →
                    </Link>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        );
        })()}
      </AnimatePresence>
    </Dialog.Root>
  );
}
