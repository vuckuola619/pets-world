"use client"
import React from 'react';

import { Search, Menu, X } from "lucide-react";
import { type AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useAtlasData } from "../hooks/useAtlasAnimals";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { audioService } from "./AudioService";
import { t } from "../lib/i18n";

import { CONTINENT_COLORS } from "../lib/regions";

/** Mobile sidebar with search, region filters, and animal list */
export default function MobileSidebar(): React.JSX.Element {
  const { mobileOpen, setMobileOpen, toggleMobileOpen, searchQuery, setSearchQuery, activeRegion, setActiveRegion, selectedId, sidebarHoveredId, setSidebarHoveredId, locale } = useMapStore();
  const tr = t(locale);
  const { regions } = useAtlasData();
  const filtered = useFilteredAnimals();

  const flyTo = (c: AnimalEntry) => {
    useMapStore.getState().setSelectedId(c.id);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={toggleMobileOpen}
        className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
        aria-label={mobileOpen ? tr.close : "Open species list"}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-14 z-30">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="mobile-sidebar-animate absolute inset-x-0 bottom-0 max-h-[60vh] flex flex-col gap-3 p-4 bg-card rounded-t-2xl overflow-hidden border-t border-border">
            <div className="flex items-center justify-between">
              <div className="w-10 h-1 rounded-full bg-border" />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold bg-accent hover:bg-accent/80 active:bg-accent/60 text-foreground transition-colors"
              >{tr.done}</button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={tr.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-accent/50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card transition-colors duration-150"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["All", ...regions].map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveRegion(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                    activeRegion === c
                      ? "region-pill-active"
                      : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                  }`}
                >
                  {tr.regions[c as keyof typeof tr.regions] ?? c}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin">
              {filtered.map((c, i) => {
                const isSelected = selectedId === c.id;
                const isHovered = sidebarHoveredId === c.id;
                const color = CONTINENT_COLORS[c.region] || "#6366f1";
                return (
                  <button
                    key={c.id}
                    onClick={() => flyTo(c)}
                    onMouseEnter={() => {
                      setSidebarHoveredId(c.id);
                      audioService.playHoverSound();
                    }}
                    onMouseLeave={() => setSidebarHoveredId(null)}
                    className={`sidebar-item country-item-animate flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${
                      isSelected
                        ? "bg-primary/8 ring-1 ring-primary/20"
                        : isHovered
                        ? "bg-accent/60"
                        : ""
                    }`}
                    style={{
                      animationDelay: `${i * 30}ms`,
                      borderLeft: isSelected
                        ? `3px solid var(--natura-emerald)`
                        : `2px solid ${color}40`,
                    }}
                  >
                    <span className="text-base">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate text-foreground">{c.country}</span>
                      <span className="block text-xs text-muted-foreground truncate">{c.animal}</span>
                    </div>
                    <span className="text-base">{c.emoji}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
