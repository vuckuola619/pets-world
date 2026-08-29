"use client"
import React from 'react';

import { useState, useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Shuffle, Globe, Search, Sun, Moon, Monitor, Volume2, VolumeX, Camera } from "lucide-react";
import { t } from "../lib/i18n";
import { type AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useAtlasData } from "../hooks/useAtlasAnimals";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { useTheme } from "../hooks/useTheme";
import { audioService } from "../components/AudioService";
import Sidebar from "../components/Sidebar";
import MobileSidebar from "../components/MobileSidebar";
import AtlasModeDropdown from "../components/AtlasModeDropdown";
import MapView from "../components/MapView";
import AnimalSearch from "../components/AnimalSearch";
import ComparePanel, { CompareModal } from "../components/ComparePanel";
import OfflineIndicator from "../components/OfflineIndicator";
import AROverlay from "../components/AROverlay";

const DEFAULT_VIEW = { longitude: 20, latitude: 20, zoom: 2 };

/** Theme icon that rotates/crossfades between sun, moon, and monitor */
function ThemeIcon({ theme }: { theme: string }): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={theme}
        className="flex"
        initial={reduceMotion ? false : { rotate: -70, opacity: 0, scale: 0.7 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { rotate: 70, opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        {theme === 'dark' ? <Moon size={15} /> : theme === 'system' ? <Monitor size={15} /> : <Sun size={15} />}
      </motion.span>
    </AnimatePresence>
  );
}

/** Home page with map, sidebar, and controls */
export default function Home(): React.JSX.Element {
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const muted = useSyncExternalStore(
    (cb) => audioService.subscribeMute(cb),
    () => audioService.isMuted(),
    () => false,
  );
  const filtered = useFilteredAnimals();
  const { atlasMode, setSelectedId, setMobileOpen, locale, setLocale, arOpen, setArOpen } = useMapStore();
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

        {/* Logo / atlas mode switcher */}
        <AtlasModeDropdown count={filtered.length} regionCount={regions.length} />

        <div className="flex-1" />

        {/* Action buttons */}
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
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={muted ? 'muted' : 'sound'}
              className="flex"
              initial={false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </motion.span>
          </AnimatePresence>
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
      <CompareModal />
    </div>
  );
}
