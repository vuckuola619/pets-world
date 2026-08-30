"use client"
import React from 'react';

import { useRef, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search, Heart, GitCompareArrows } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useAtlasData } from "../hooks/useAtlasAnimals";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { useFavorites } from "../hooks/useFavorites";
import { audioService } from "./AudioService";
import HeartButton from "./HeartButton";
import AnimatedNumber from "./AnimatedNumber";
import { t } from "../lib/i18n";
import { IUCN_CONFIG, STATUS_CODE } from "../lib/iucn";
import AnimalListSkeleton from "./AnimalListSkeleton";
import Link from "next/link";

import { CONTINENT_COLORS } from "../lib/regions";


const CONTINENT_EMOJI: Record<string, string> = {
  "All": "🌍",
  "North America": "🦅", "South America": "🦎", Europe: "🦌",
  Africa: "🦁", Asia: "🐼", Oceania: "🦘",
  "Middle East": "🐪", Arctic: "🐻‍❄️", Antarctic: "🐧",
};

/** Gentle floating hearts for the empty-favorites state (rare moment — this
 *  is where the delight budget lives). Pure SVG, no emoji. */
function EmptyFavorites({ title, hint }: { title: string; hint: string }): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const hearts = [
    { size: 40, x: 18, y: 26, opacity: 0.9, delay: 0 },
    { size: 26, x: 64, y: 8, opacity: 0.55, delay: 0.6 },
    { size: 20, x: 96, y: 34, opacity: 0.35, delay: 1.1 },
  ];
  return (
    <motion.div
      className="px-4 py-10 text-center"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="relative mx-auto h-16 w-28" aria-hidden>
        {hearts.map((h, i) => (
          <motion.svg
            key={i}
            viewBox="0 0 24 24"
            width={h.size}
            height={h.size}
            className="absolute"
            style={{ left: h.x, top: h.y, opacity: h.opacity }}
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: h.delay }}
          >
            <path
              d="M12 21s-7.5-4.7-10-9.3C.6 8.6 2.2 5 5.6 5c2 0 3.4 1.1 4.4 2.6C11 6.1 12.4 5 14.4 5c3.4 0 5 3.6 3.6 6.7C19.5 16.3 12 21 12 21z"
              fill="var(--natura-coral)"
            />
          </motion.svg>
        ))}
      </div>
      <div className="mt-3 text-sm font-medium text-foreground">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</div>
    </motion.div>
  );
}

/** Desktop sidebar with virtualized animal list grouped by classification */
export default function Sidebar(): React.JSX.Element {
  const {
    searchQuery, setSearchQuery, activeRegion, setActiveRegion,
    selectedId, sidebarHoveredId, setSidebarHoveredId, locale,
    atlasMode, showFavoritesOnly, setShowFavoritesOnly, compareIds, addCompare, removeCompare,
  } = useMapStore();
  const tr = t(locale);
  const { regions } = useAtlasData();
  const allFiltered = useFilteredAnimals();
  const { favorites } = useFavorites();
  const parentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Apply favorites filter
  const filtered = useMemo(() => {
    if (!showFavoritesOnly) return allFiltered;
    return allFiltered.filter((c) => favorites.includes(c.id));
  }, [allFiltered, showFavoritesOnly, favorites]);

  // Force re-measure after layout settles
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Group by classification for sticky headers
  const groupedItems = useMemo(() => {
    const groups: ({ type: 'header'; classification: string; id: string } | { type: 'animal'; animal: AnimalEntry; id: string })[] = [];
    let lastClass = '';
    let headerIdx = 0;
    for (const c of filtered) {
      if (c.classification !== lastClass) {
        lastClass = c.classification;
        groups.push({ type: 'header', classification: c.classification, id: `h-${c.classification}-${headerIdx++}` });
      }
      groups.push({ type: 'animal', animal: c, id: c.id });
    }
    return groups;
  }, [filtered]);

  const virtualizer = useVirtualizer({
    count: groupedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => groupedItems[i].type === 'header' ? 36 : 72,
    overscan: 10,
    enabled: mounted,
  });

  // Scroll to selected animal when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    const idx = groupedItems.findIndex((item) => item.type === 'animal' && item.animal.id === selectedId);
    if (idx >= 0) {
      virtualizer.scrollToIndex(idx, { behavior: 'smooth', align: 'center' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollToIndex is stable, groupedItems changes on every filter
  }, [selectedId]);

  const flyTo = (c: AnimalEntry) => {
    useMapStore.getState().setSelectedId(c.id);
    useMapStore.getState().setFocusTarget({ lng: c.lng, lat: c.lat });
    useMapStore.getState().setMobileOpen(false);
  };

  return (
    <aside key={atlasMode} className="hidden md:flex w-80 shrink-0 flex-col gap-3 p-4 border-r border-border z-10 overflow-hidden animate-fade-in-scale" style={{ background: 'var(--sidebar)' }}>
      {/* Search */}
      <div className="relative group">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
        <input
          type="text"
          placeholder={tr.search}
          aria-label={tr.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-accent/50 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        />
      </div>

      {/* Region pills */}
      <div className="flex flex-wrap gap-1.5">
        {["All", ...regions].map((c) => {
          const isActive = activeRegion === c;
          return (
            <button
              key={c}
              onClick={() => setActiveRegion(c)}
              className={`press flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? "region-pill-active"
                  : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
              }`}
            >
              <span className="text-xs">{CONTINENT_EMOJI[c] ?? "🌐"}</span>
              {tr.regions[c as keyof typeof tr.regions] ?? c}
            </button>
          );
        })}
      </div>

      {/* Counter + About link + Favorites filter */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-muted-foreground font-medium">
          <AnimatedNumber value={filtered.length} /> {atlasMode === 'prehistoric' ? tr.dinosaurUnit : tr.speciesUnit}
        </span>
        <div className="flex items-center gap-1">
          <Link
            href="/about"
            className="text-[11px] font-medium px-2 py-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            title={tr.about.link}
          >
            {t(locale).about.link}
          </Link>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all duration-200 ${
              showFavoritesOnly
                ? "bg-red-500/10 text-red-500"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            title={showFavoritesOnly ? "Show all" : "Show favorites only"}
          >
            <Heart size={11} fill={showFavoritesOnly ? "currentColor" : "none"} />
            {favorites.length > 0 && <span>{favorites.length}</span>}
          </button>
        </div>
      </div>

      {/* Virtualized list */}
      <div ref={parentRef} className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
        {mounted && filtered.length === 0 ? (
          showFavoritesOnly && favorites.length === 0 ? (
            <EmptyFavorites title={tr.favorites.emptyTitle} hint={tr.favorites.emptyHint} />
          ) : (
            <div className="px-4 py-10 text-center animate-fade-in-up">
              <div className="text-2xl" aria-hidden>🔍</div>
              <div className="mt-2 text-sm font-medium text-foreground">{tr.noResults}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{tr.noResultsHint}</div>
            </div>
          )
        ) : (
          !mounted && <AnimalListSkeleton />
        )}
        <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = groupedItems[virtualItem.index];
            if (item.type === 'header') {
              return (
                <div
                  key={item.id}
                  className="absolute left-0 right-0 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-widest z-10"
                  style={{
                    height: `${virtualItem.size}px`,
                    top: `${virtualItem.start}px`,
                    color: 'var(--natura-emerald)',
                    background: 'var(--sidebar)',
                  }}
                >
                  <span className="w-4 h-px" style={{ background: 'var(--natura-sage)' }} />
                  {item.classification}
                  <span className="flex-1 h-px" style={{ background: 'var(--natura-sage)', opacity: 0.4 }} />
                </div>
              );
            }

            const c = item.animal;
            const isSelected = selectedId === c.id;
            const isHovered = sidebarHoveredId === c.id;
            const color = CONTINENT_COLORS[c.region] || "#6366f1";
            const code = STATUS_CODE[c.conservationStatus] || 'LC';
            const iucnBg = IUCN_CONFIG[code]?.bg ?? '#888';
            const isInCompare = compareIds.includes(c.id);

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => flyTo(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flyTo(c); } }}
                onMouseEnter={() => {
                  setSidebarHoveredId(c.id);
                  audioService.playHoverSound();
                }}
                onMouseLeave={() => setSidebarHoveredId(null)}
                className={`sidebar-item absolute left-0 right-0 flex items-center gap-2 rounded-xl px-3 text-left text-sm cursor-pointer ${
                  isSelected
                    ? "bg-primary/8 ring-1 ring-primary/20"
                    : isHovered
                    ? "bg-accent/60"
                    : ""
                }`}
                style={{
                  height: `${virtualItem.size}px`,
                  top: `${virtualItem.start}px`,
                  borderLeft: isSelected
                    ? `3px solid var(--natura-emerald)`
                    : `3px solid ${color}30`,
                }}
              >
                {/* IUCN dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: iucnBg,
                    boxShadow: `0 0 0 2px ${iucnBg}30`,
                  }}
                />
                <span className="sr-only">{c.conservationStatus}</span>

                {/* Emoji */}
                <span className="text-lg">{c.emoji}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium text-foreground text-[13px] leading-tight">{c.animal}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {c.flag} {c.country}
                  </span>
                </div>

                {/* Favorite button */}
                <HeartButton
                  animalId={c.id}
                  animalName={c.animal}
                  size={12}
                  className="press p-0.5"
                />

                {/* Compare button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isInCompare) removeCompare(c.id);
                    else addCompare(c.id);
                  }}
                  className={`press shrink-0 p-0.5 transition-colors ${isInCompare ? "text-primary" : "text-muted-foreground/30 hover:text-primary/60"}`}
                  aria-label={isInCompare ? `Remove ${c.animal} from comparison` : `Add ${c.animal} to comparison`}
                >
                  <GitCompareArrows size={12} />
                </button>

                {(
                  <Link
                    href={`/animal/${c.slug}`}
                    prefetch={false}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors text-xs"
                    title="View details"
                  >
                    →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
