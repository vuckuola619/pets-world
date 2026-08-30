"use client"
import React from 'react';

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "../lib/motion";
import { Search, X } from "lucide-react";
import { useMapStore } from "../store/useMapStore";
import { IUCN_CONFIG, statusCodeFor, IUCN_FALLBACK } from "../lib/iucn";
import { t } from "../lib/i18n";
import { getAtlasRecords } from "../hooks/useAtlasAnimals";
import IucnDot from "./IucnDot";

const WILDLIFE_IUCN_FILTERS = ["LC", "NT", "VU", "EN", "CR"];
const PREHISTORIC_IUCN_FILTERS = ["EX"];

/** Stagger delay for result rows, capped so long lists never trail behind */
function rowDelay(index: number): number {
  return Math.min(index * 0.035, 0.28);
}

/** Command-palette style animal search with IUCN and classification filters.
 *  Radix Dialog owns focus trap/restore + Escape; motion owns enter/exit. */
export default function AnimalSearch(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [iucnFilters, setIucnFilters] = useState<string[]>([]);
  const [classFilters, setClassFilters] = useState<string[]>([]);
  const { atlasMode, selectedId, setSelectedId, locale, setSearchQuery, setActiveRegion, searchOpen, setSearchOpen } = useMapStore();
  const tr = t(locale);
  const reduceMotion = useReducedMotion();
  const records = useMemo(() => getAtlasRecords(atlasMode), [atlasMode]);
  const allClasses = useMemo(() => Array.from(new Set(records.map((c) => c.classification))).sort(), [records]);
  const iucnFilterOptions = atlasMode === 'prehistoric' ? PREHISTORIC_IUCN_FILTERS : WILDLIFE_IUCN_FILTERS;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!useMapStore.getState().searchOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchOpen]);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    const activeIucnFilters = iucnFilters.filter((f) => iucnFilterOptions.includes(f));
    const activeClassFilters = classFilters.filter((f) => allClasses.includes(f));
    return records.filter((c) => {
      const matchSearch = !q || [c.animal, c.scientificName, c.country, c.region, c.habitat, ...c.funFacts].join(' ').toLowerCase().includes(q);
      const matchIucn = activeIucnFilters.length === 0 || activeIucnFilters.some((f) => {
        const statusCode = statusCodeFor(c.conservationStatus);
        return statusCode === f;
      });
      const matchClass = activeClassFilters.length === 0 || activeClassFilters.includes(c.classification);
      return matchSearch && matchIucn && matchClass;
    });
  }, [query, iucnFilters, iucnFilterOptions, classFilters, allClasses, records]);

  const selectAnimal = (id: string) => {
    const c = records.find((x) => x.id === id);
    if (!c) return;
    setSelectedId(id);
    useMapStore.getState().setFocusTarget({ lng: c.lng, lat: c.lat });
    setSearchQuery("");
    setActiveRegion("All");
    setSearchOpen(false);
  };

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const fast = { duration: 0.15, ease: EASE_OUT_EXPO };

  return (
    <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
      <AnimatePresence>
        {searchOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fast}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-label={tr.search}>
              <motion.div
                className="fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-lg flex-col overflow-hidden shadow-2xl outline-none max-h-[100dvh] md:top-[15vh] md:rounded-xl md:border md:max-h-none"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
                transition={fast}
              >
                <Dialog.Title className="sr-only">{tr.search}</Dialog.Title>
                <Dialog.Description className="sr-only">{tr.noResultsHint}</Dialog.Description>

                {/* Search input */}
                <div className="flex items-center gap-2 px-4 py-4 md:py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <Search size={18} className="text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tr.search}
                    aria-label={tr.search}
                    className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
                  />
                  {(query || iucnFilters.length || classFilters.length) ? (
                    <button onClick={() => { setQuery(""); setIucnFilters([]); setClassFilters([]); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={tr.clear}>
                      <X size={14} />
                    </button>
                  ) : null}
                  <kbd className="hidden sm:inline text-micro text-muted-foreground px-1.5 py-0.5 rounded border" style={{ background: 'var(--accent)', borderColor: 'var(--border)' }}>ESC</kbd>
                </div>

                {/* Active filters */}
                {(iucnFilters.length > 0 || classFilters.length > 0) && (
                  <div className="flex flex-wrap gap-1 px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    {iucnFilters.map((f) => (
                      <button key={f} onClick={() => toggleFilter(iucnFilters, setIucnFilters, f)}
                        className="flex items-center gap-1 text-micro px-2 py-0.5 rounded-full border text-muted-foreground hover:bg-accent transition-colors" style={{ borderColor: 'var(--border)' }}>
                        <IucnDot code={f} color={IUCN_CONFIG[f]?.bg} size={10} />
                        {f} <X size={10} />
                      </button>
                    ))}
                    {classFilters.map((f) => (
                      <button key={f} onClick={() => toggleFilter(classFilters, setClassFilters, f)}
                        className="flex items-center gap-1 text-micro px-2 py-0.5 rounded-full border text-muted-foreground hover:bg-accent transition-colors" style={{ borderColor: 'var(--border)' }}>
                        {f} <X size={10} />
                      </button>
                    ))}
                  </div>
                )}

                {/* IUCN filter chips */}
                <div className="flex gap-1 px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  {iucnFilterOptions.map((f) => {
                    const active = iucnFilters.includes(f);
                    return (
                      <motion.button
                        key={f}
                        onClick={() => toggleFilter(iucnFilters, setIucnFilters, f)}
                        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                        animate={reduceMotion || !active ? { scale: 1 } : { scale: [1, 1.08, 1] }}
                        transition={{ duration: 0.16 }}
                        aria-pressed={active}
                        className={`flex items-center gap-1 text-micro px-2 py-0.5 rounded-full transition-colors ${
                          active ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:bg-accent/80"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: active ? "currentColor" : IUCN_CONFIG[f]?.bg ?? IUCN_FALLBACK }} />
                        {f}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Class filter chips */}
                <div className="flex flex-wrap gap-1 px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  {allClasses.map((c) => {
                    const active = classFilters.includes(c);
                    return (
                      <motion.button
                        key={c}
                        onClick={() => toggleFilter(classFilters, setClassFilters, c)}
                        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                        animate={reduceMotion || !active ? { scale: 1 } : { scale: [1, 1.08, 1] }}
                        transition={{ duration: 0.16 }}
                        aria-pressed={active}
                        className={`text-micro px-2 py-0.5 rounded-full transition-colors ${
                          active ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:bg-accent/80"
                        }`}
                      >
                        {c}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Results */}
                <div className="max-h-[40vh] overflow-y-auto scrollbar-thin">
                  {results.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="text-sm font-medium text-foreground">{tr.noResults}</div>
                      <div className="mt-1 text-xs text-muted-foreground animate-fade-in-up">{tr.noResultsHint}</div>
                    </div>
                  ) : (
                    results.slice(0, 50).map((c, i) => {
                      const code = statusCodeFor(c.conservationStatus);
                      const iucn = IUCN_CONFIG[code];
                      return (
                        <motion.button
                          key={c.id}
                          onClick={() => selectAnimal(c.id)}
                          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: EASE_OUT_EXPO, delay: rowDelay(i) }}
                          className={`w-full flex items-center gap-3 px-4 py-3 md:py-2 text-left text-sm hover:bg-accent transition-colors ${
                            selectedId === c.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <IucnDot code={code} color={iucn?.bg} />
                          <span className="sr-only">{c.conservationStatus}</span>
                          <span className="text-lg">{c.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-foreground">{c.animal}</div>
                            <div className="text-micro text-muted-foreground italic truncate">{c.scientificName}</div>
                          </div>
                          <span className="text-micro text-muted-foreground">{c.country}</span>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
