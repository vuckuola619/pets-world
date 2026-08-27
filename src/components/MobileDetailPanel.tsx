"use client"
import React from 'react';

import { X, Volume2, Heart, GitCompareArrows, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type AnimalEntry } from "../data/countries";
import type { DinosaurAnimalEntry } from "../data/dinosaurs";
import { useMapStore } from "../store/useMapStore";
import { getAtlasRecords } from "../hooks/useAtlasAnimals";
import { useAnimalMedia } from "../hooks/useAnimalMedia";
import { localDinoThumb } from "../lib/wikiImages";
import { useFavorites } from "../hooks/useFavorites";
import { audioService } from "./AudioService";
import { t } from "../lib/i18n";
import { IUCN_CONFIG, STATUS_CODE } from "../lib/iucn";
import { useState } from "react";
import { translateCountry, getEntryFunFacts } from "../lib/profileText";

import { CONTINENT_COLORS } from "../lib/regions";

function getDinosaurRecord(entry: AnimalEntry | null) {
  return entry && 'dinosaur' in entry ? (entry as DinosaurAnimalEntry).dinosaur : null;
}

/** Premium mobile detail panel with glassmorphism */
export default function MobileDetailPanel(): React.JSX.Element | null {
  const { atlasMode, selectedId, setSelectedId, locale, compareIds, addCompare, removeCompare } = useMapStore();
  const tr = t(locale);
  const isPrehistoric = atlasMode === 'prehistoric';
  const selected = selectedId ? getAtlasRecords(atlasMode).find((c) => c.id === selectedId) ?? null : null;
  const selectedDinosaur = getDinosaurRecord(selected);
  const { imageUrl, imageLoading } = useAnimalMedia(selected?.animal ?? null, selected?.wikiUrl, selected?.imageUrl);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasImgError, setHasImgError] = useState(false);

  if (!selected) return null;

  const color = CONTINENT_COLORS[selected.region] || "#6366f1";
  const iucnCode = STATUS_CODE[selected.conservationStatus] || 'LC';
  const iucnBg = IUCN_CONFIG[iucnCode]?.bg ?? '#888';
  const isFav = isFavorite(selected.id);
  const isInCompare = compareIds.includes(selected.id);

  const playSound = () => {
    if (!selected) return;
    setIsPlaying(true);
    audioService.playAnimalRepresentativeSound(selected.animal, selected.classification);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 top-14 z-30">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setSelectedId(null)}
      />
      <div className="mobile-sidebar-animate absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-2xl overflow-hidden border-t" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Close button */}
        <button
          onClick={() => setSelectedId(null)}
          className="absolute -top-3 right-3 z-20 w-12 h-12 flex items-center justify-center rounded-full shadow-lg border-2 transition-all active:scale-95"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
          }}
          aria-label={tr.close}
        >
          <X size={22} className="text-muted-foreground" />
        </button>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'var(--border)' }} />

        <div className="overflow-y-auto p-4 pb-8 scrollbar-thin">
          {/* Image */}
          <div className="w-full rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '16/9', maxHeight: 240, background: 'var(--accent)' }}>
            {imageLoading || (!imageUrl || hasImgError) ? (
              <div className="flex items-center justify-center w-full h-full" style={{ background: 'var(--accent)' }}>
                <span className="text-6xl">{selected.emoji}</span>
              </div>
            ) : (
              <Image
                src={isPrehistoric && selected.imageKind === 'photo' ? localDinoThumb(selected.slug, 480) : imageUrl}
                alt={selected.animal}
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
            <span className="text-lg">{selected.flag}</span>
            <span className="font-semibold">{translateCountry(selected.country, locale)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl">{selected.emoji}</span>
            <div className="flex-1">
              <div className="font-semibold text-foreground font-[var(--font-heading)]">{selected.animal}</div>
              <div className="text-xs text-muted-foreground italic">{selected.scientificName}</div>
            </div>
            {/* Action buttons */}
            <button
              onClick={() => toggleFavorite(selected.id)}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'var(--accent)' }}
              aria-label={isFav ? tr.favorites.removeFromFavorites : tr.favorites.addToFavorites}
            >
              <Heart size={18} fill={isFav ? "#ef4444" : "none"} className={isFav ? "text-red-500" : "text-muted-foreground"} />
            </button>
            <button
              onClick={() => isInCompare ? removeCompare(selected.id) : addCompare(selected.id)}
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
              {tr.classification[selected.classification as keyof typeof tr.classification] ?? selected.classification}
            </div>
            <div
              className="text-[10px] px-2.5 py-1 rounded-full font-bold"
              style={{
                background: `${iucnBg}20`,
                color: iucnBg,
              }}
            >
              {iucnCode} · {tr.conservation[selected.conservationStatus as keyof typeof tr.conservation] ?? selected.conservationStatus}
            </div>
            <div className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: `${color}15`, color }}>
              {tr.regions[selected.region as keyof typeof tr.regions] ?? selected.region}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="glass-card rounded-lg px-2.5 py-2 text-center">
              <div className="text-[9px] text-muted-foreground uppercase font-semibold">Pop.</div>
              <div className="text-xs font-medium text-foreground">{selected.population}</div>
            </div>
            <div className="glass-card rounded-lg px-2.5 py-2 text-center">
              <div className="text-[9px] text-muted-foreground uppercase font-semibold">Diet</div>
              <div className="text-xs font-medium text-foreground">{selected.diet}</div>
            </div>
            <div className="glass-card rounded-lg px-2.5 py-2 text-center">
              <div className="text-[9px] text-muted-foreground uppercase font-semibold">Class</div>
              <div className="text-xs font-medium text-foreground">{selected.classification}</div>
            </div>
          </div>

          {/* Fun facts */}
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
            {getEntryFunFacts(selected, locale).slice(0, 3).map((f, i) => (
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

          {selected.wikiUrl && (
            <a
              href={selected.wikiUrl}
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
              href={`/animal/${selected.slug}`}
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
      </div>
    </div>
  );
}
