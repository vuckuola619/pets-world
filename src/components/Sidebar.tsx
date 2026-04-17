"use client"
import React from 'react';

import { useRef, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type AnimalEntry, continents } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { audioService } from "./AudioService";
import { t } from "../lib/i18n";
import { IUCN_CONFIG } from "../lib/iucn";
import AnimalListSkeleton from "./AnimalListSkeleton";
import Link from "next/link";

const STATUS_CODE: Record<string, string> = {
  'Critically Endangered': 'CR', 'Endangered': 'EN', 'Vulnerable': 'VU',
  'Near Threatened': 'NT', 'Least Concern': 'LC', 'Data Deficient': 'DD',
};

const CONTINENT_COLORS: Record<string, string> = {
  "North America": "#f87171", "South America": "#fb923c", Europe: "#60a5fa",
  Africa: "#fbbf24", Asia: "#f472b6", Oceania: "#34d399",
  "Middle East": "#c084fc", Arctic: "#93c5fd", Antarctic: "#e0f2fe",
};

const CONTINENT_EMOJI: Record<string, string> = {
  "All": "🌍",
  "North America": "🦅", "South America": "🦎", Europe: "🦌",
  Africa: "🦁", Asia: "🐼", Oceania: "🦘",
  "Middle East": "🐪", Arctic: "🐻‍❄️", Antarctic: "🐧",
};

/** Desktop sidebar with virtualized animal list grouped by classification */
export default function Sidebar(): React.JSX.Element {
  const { searchQuery, setSearchQuery, activeRegion, setActiveRegion, selectedId, sidebarHoveredId, setSidebarHoveredId, locale } = useMapStore();
  const tr = t(locale);
  const filtered = useFilteredAnimals();
  const parentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

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
    useMapStore.getState().setMobileOpen(false);
  };

  return (
    <aside className="hidden md:flex w-80 shrink-0 flex-col gap-3 p-4 border-r border-border z-10 overflow-hidden" style={{ background: 'var(--sidebar)' }}>
      {/* Search */}
      <div className="relative group">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
        <input
          type="text"
          placeholder={tr.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-accent/50 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        />
      </div>

      {/* Region pills */}
      <div className="flex flex-wrap gap-1.5">
        {["All", ...continents].map((c) => {
          const isActive = activeRegion === c;
          return (
            <button
              key={c}
              onClick={() => setActiveRegion(c)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
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

      {/* Counter */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-muted-foreground font-medium">
          {filtered.length} species
        </span>
      </div>

      {/* Virtualized list */}
      <div ref={parentRef} className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
        {(!mounted || virtualizer.getVirtualItems().length === 0) && <AnimalListSkeleton />}
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

            return (
              <button
                key={item.id}
                onClick={() => flyTo(c)}
                onMouseEnter={() => {
                  setSidebarHoveredId(c.id);
                  audioService.playHoverSound();
                }}
                onMouseLeave={() => setSidebarHoveredId(null)}
                className={`sidebar-item absolute left-0 right-0 flex items-center gap-2.5 rounded-xl px-3 text-left text-sm ${
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

                {/* Region badge */}
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                  style={{
                    background: `${color}15`,
                    color: color,
                  }}
                >
                  {c.region}
                </span>

                {/* Detail link indicator */}
                <Link
                  href={`/animal/${c.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors text-xs"
                  title="View details"
                >
                  →
                </Link>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
