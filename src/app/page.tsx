"use client"
import React from 'react';

import { useState, useCallback } from "react";
import { Shuffle, Globe, Search, Leaf, Sun, Moon, Monitor, Volume2, VolumeX, Camera } from "lucide-react";
import { t } from "../lib/i18n";
import { countries, type AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { useTheme } from "../hooks/useTheme";
import { audioService } from "../components/AudioService";
import Sidebar from "../components/Sidebar";
import MobileSidebar from "../components/MobileSidebar";
import MapView from "../components/MapView";
import AnimalSearch from "../components/AnimalSearch";
import ComparePanel from "../components/ComparePanel";
import OfflineIndicator from "../components/OfflineIndicator";
import AROverlay from "../components/AROverlay";

const DEFAULT_VIEW = { longitude: 20, latitude: 20, zoom: 2 };

/** Theme icon component */
function ThemeIcon({ theme }: { theme: string }): React.JSX.Element {
  if (theme === 'dark') return <Moon size={15} />;
  if (theme === 'system') return <Monitor size={15} />;
  return <Sun size={15} />;
}

/** Home page with map, sidebar, and controls */
export default function Home(): React.JSX.Element {
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const filtered = useFilteredAnimals();
  const { selectedId, setSelectedId, setMobileOpen, locale, setLocale, arOpen, setArOpen } = useMapStore();
  const { theme, toggleTheme } = useTheme();

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

  // AR overlay mode
  if (arOpen) {
    return <AROverlay onClose={() => setArOpen(false)} />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden" style={{ background: 'var(--natura-surface)' }}>
      {/* ─── Premium Header ─── */}
      <header className="glass-header flex h-14 shrink-0 items-center gap-2 px-4 z-20">
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          title="Search (⌘K)"
        >
          <Search size={15} />
          <span className="hidden sm:inline text-xs text-muted-foreground">⌘K</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          title={`Theme: ${theme}`}
          aria-label={`Switch theme, currently ${theme}`}
        >
          <ThemeIcon theme={theme} />
        </button>

        {/* Audio mute toggle */}
        <button
          onClick={() => audioService.toggleMute()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          title="Toggle sound"
          aria-label={audioService.isMuted() ? 'Unmute sounds' : 'Mute sounds'}
        >
          {audioService.isMuted() ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Locale toggle */}
        <button
          onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          aria-label={`Switch to ${locale === 'id' ? 'English' : 'Indonesian'}`}
        >
          <Globe size={15} />
          <span className="text-xs font-medium">{locale === 'id' ? 'EN' : 'ID'}</span>
        </button>

        {/* AR mode (mobile only) */}
        <button
          onClick={() => setArOpen(true)}
          className="md:hidden flex items-center gap-1 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          title="AR Mode"
          aria-label="Open AR mode"
        >
          <Camera size={15} />
        </button>

        {/* Random */}
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
      <OfflineIndicator />

      {/* ─── Main Content ─── */}
      <div id="main-content" className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <MapView viewState={viewState} setViewState={setViewState} />
      </div>

      <ComparePanel />
    </div>
  );
}
