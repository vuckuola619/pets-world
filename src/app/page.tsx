"use client"
import React from 'react';

import { useState, useCallback } from "react";
import { Shuffle, Globe, Search, Leaf, Sun, Moon, Monitor, Volume2, VolumeX, Camera, Bone } from "lucide-react";
import { t } from "../lib/i18n";
import { type AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useAtlasData } from "../hooks/useAtlasAnimals";
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
  const { atlasMode, setAtlasMode, setSelectedId, setMobileOpen, locale, setLocale, arOpen, setArOpen } = useMapStore();
  const { records, regions } = useAtlasData();
  const { theme, toggleTheme } = useTheme();
  const isPrehistoric = atlasMode === 'prehistoric';

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
    const c = records[Math.floor(Math.random() * records.length)];
    flyTo(c);
  }, [flyTo, records]);

  // AR overlay mode
  if (arOpen) {
    return <AROverlay onClose={() => setArOpen(false)} />;
  }

  return (
    <div className={`flex h-screen w-screen flex-col overflow-hidden ${isPrehistoric ? 'prehistoric-atlas' : ''}`} style={{ background: 'var(--natura-surface)' }}>
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
              {isPrehistoric ? 'Era Purba Atlas' : t(locale).title}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {filtered.length} {isPrehistoric ? 'dinosaurs' : t(locale).countries} · {regions.length} Regions
            </span>
          </div>
          <span className="sm:hidden text-sm font-semibold text-foreground">
            {isPrehistoric ? 'Era Purba' : t(locale).title}
          </span>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button
          onClick={() => setAtlasMode(isPrehistoric ? 'wildlife' : 'prehistoric')}
          className={`flex items-center gap-1.5 press px-2.5 py-1.5 text-sm rounded-lg transition-all duration-200 ${
            isPrehistoric
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title={isPrehistoric ? 'Switch to wildlife atlas' : 'Switch to Era Purba'}
          aria-label={isPrehistoric ? 'Switch to wildlife atlas' : 'Switch to dinosaur era atlas'}
        >
          {isPrehistoric ? <Bone size={15} /> : <Leaf size={15} />}
          <span className="hidden sm:inline text-xs font-medium">{isPrehistoric ? 'Era Purba' : 'Wildlife'}</span>
        </button>

        <button
          onClick={() => useMapStore.getState().setSearchOpen(true)}
          className="flex items-center gap-1.5 press px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          title="Search (⌘K)"
        >
          <Search size={15} />
          <span className="hidden sm:inline text-xs text-muted-foreground">⌘K</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 press px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          title={`Theme: ${theme}`}
          aria-label={`Switch theme, currently ${theme}`}
        >
          <ThemeIcon theme={theme} />
        </button>

        {/* Audio mute toggle */}
        <button
          onClick={() => audioService.toggleMute()}
          className="flex items-center gap-1.5 press px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          title="Toggle sound"
          aria-label={audioService.isMuted() ? 'Unmute sounds' : 'Mute sounds'}
        >
          {audioService.isMuted() ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Locale toggle */}
        <button
          onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
          className="flex items-center gap-1.5 press px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
          aria-label={`Switch to ${locale === 'id' ? 'English' : 'Indonesian'}`}
        >
          <Globe size={15} />
          <span className="text-xs font-medium">{locale === 'id' ? 'EN' : 'ID'}</span>
        </button>

        {/* AR mode (mobile only) */}
        {!isPrehistoric && (
          <button
            onClick={() => setArOpen(true)}
            className="md:hidden flex items-center gap-1 press px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
            title="AR Mode"
            aria-label="Open AR mode"
          >
            <Camera size={15} />
          </button>
        )}

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
