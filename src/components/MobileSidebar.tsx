"use client"
import React from 'react';

import { Search, Menu, X } from "lucide-react";
import { type AnimalEntry, continents } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { audioService } from "./AudioService";
import { t } from "../lib/i18n";

const CONTINENT_COLORS: Record<string, string> = {
  "North America": "#f87171",
  "South America": "#fb923c",
  Europe: "#60a5fa",
  Africa: "#fbbf24",
  Asia: "#f472b6",
  Oceania: "#34d399",
  "Middle East": "#c084fc",
  Arctic: "#93c5fd",
  Antarctic: "#e0f2fe",
};

/** Mobile sidebar with search, region filters, and animal list */
export default function MobileSidebar(): React.JSX.Element {
  const { mobileOpen, setMobileOpen, toggleMobileOpen, searchQuery, setSearchQuery, activeRegion, setActiveRegion, selectedId, sidebarHoveredId, setSidebarHoveredId, locale } = useMapStore();
  const tr = t(locale);
  const filtered = useFilteredAnimals();

  const flyTo = (c: AnimalEntry) => {
    useMapStore.getState().setSelectedId(c.id);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={toggleMobileOpen}
        className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
        aria-label={mobileOpen ? tr.close : undefined}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-14 z-30">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="mobile-sidebar-animate absolute inset-x-0 bottom-0 max-h-[60vh] flex flex-col gap-3 p-4 bg-white rounded-t-2xl overflow-hidden border-t border-zinc-200">
            <div className="flex items-center justify-between">
              <div className="w-10 h-1 rounded-full bg-zinc-200" />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
              >{tr.done}</button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={tr.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white transition-colors duration-150"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["All", ...continents].map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveRegion(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                    activeRegion === c
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
                  }`}
                >
                  {tr.regions[c as keyof typeof tr.regions] ?? c}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto">
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
                    className={`sidebar-item country-item-animate flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                      isSelected
                        ? "bg-blue-50 border-l-2 border-l-blue-500"
                        : isHovered
                        ? "bg-zinc-50"
                        : ""
                    }`}
                    style={{
                      animationDelay: `${i * 30}ms`,
                      ...(isSelected ? {} : { borderLeft: `2px solid ${color}40` }),
                    }}
                  >
                    <span className="text-base">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate text-zinc-800">{c.country}</span>
                      <span className="block text-xs text-zinc-400 truncate">{c.animal}</span>
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
