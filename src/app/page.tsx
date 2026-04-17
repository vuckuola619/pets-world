"use client"
import React from 'react';

import { useState, useCallback } from "react";
import { MapPin, Shuffle, Globe, Search, Leaf } from "lucide-react";
import { t } from "../lib/i18n";
import { countries, type AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { audioService } from "../components/AudioService";
import Sidebar from "../components/Sidebar";
import MobileSidebar from "../components/MobileSidebar";
import MapView from "../components/MapView";
import AnimalSearch from "../components/AnimalSearch";

const DEFAULT_VIEW = { longitude: 20, latitude: 20, zoom: 2 };

/** Home page with map, sidebar, and controls */
export default function Home(): React.JSX.Element {
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const filtered = useFilteredAnimals();
  const { selectedId, setSelectedId, setMobileOpen, locale, setLocale } = useMapStore();

  const flyTo = useCallback((c: AnimalEntry) => {
    setSelectedId(c.id);
    setViewState((v) => ({
      ...v,
      longitude: c.lng,
      latitude: c.lat,
      zoom: Math.max(v.zoom, 4),
    }));
    audioService.playDingSound();
    setMobileOpen(false);
  }, [setSelectedId, setMobileOpen]);

  const randomAnimal = useCallback(() => {
    const c = countries[Math.floor(Math.random() * countries.length)];
    flyTo(c);
  }, [flyTo]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden" style={{ background: 'var(--natura-surface)' }}>
      {/* ─── Premium Header ─── */}
      <header className="glass-header flex h-14 shrink-0 items-center gap-3 px-4 z-20">
        <MobileSidebar />

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-natura-gradient text-white">
            <Leaf size={16} className="drop-shadow-sm" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold font-[var(--font-heading)] text-foreground leading-tight">
              {t(locale).title}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {filtered.length} {t(locale).countries} · 9 Continents
            </span>
          </div>
          <span className="sm:hidden text-sm font-semibold text-foreground">
            {t(locale).title}
          </span>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button
          onClick={() => useMapStore.getState().setSearchOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
        >
          <Search size={15} />
          <span className="hidden sm:inline text-xs text-muted-foreground">⌘K</span>
        </button>

        <button
          onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
        >
          <Globe size={15} />
          <span className="text-xs font-medium">{locale === 'id' ? 'EN' : 'ID'}</span>
        </button>

        <button
          onClick={randomAnimal}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
          }}
        >
          <Shuffle size={13} />
          {t(locale).random}
        </button>
      </header>

      <AnimalSearch />

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <MapView viewState={viewState} setViewState={setViewState} />
      </div>
    </div>
  );
}
