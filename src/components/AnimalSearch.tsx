"use client"
import React from 'react';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, X } from "lucide-react";
import { countries } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { IUCN_CONFIG } from "../lib/iucn";
import { t } from "../lib/i18n";

const IUCN_FILTERS = ["LC", "NT", "VU", "EN", "CR"];
const ALL_CLASSES = Array.from(new Set(countries.map((c) => c.classification))).sort();

/** Maps conservation status string to IUCN code */
function conservationToCode(status: string): string {
  const map: Record<string, string> = {
    "Least Concern": "LC",
    "Near Threatened": "NT",
    "Vulnerable": "VU",
    "Endangered": "EN",
    "Critically Endangered": "CR",
    "Data Deficient": "DD",
  };
  return map[status] ?? "LC";
}

/** Command-palette style animal search with IUCN and classification filters */
export default function AnimalSearch(): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [iucnFilters, setIucnFilters] = useState<string[]>([]);
  const [classFilters, setClassFilters] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedId, setSelectedId, locale, setSearchQuery, setActiveRegion } = useMapStore();
  const tr = t(locale);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return countries.filter((c) => {
      const matchSearch = !q || c.animal.toLowerCase().includes(q) || c.scientificName.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
      const matchIucn = iucnFilters.length === 0 || iucnFilters.some((f) => {
        const statusCode = conservationToCode(c.conservationStatus);
        return statusCode === f;
      });
      const matchClass = classFilters.length === 0 || classFilters.includes(c.classification);
      return matchSearch && matchIucn && matchClass;
    });
  }, [query, iucnFilters, classFilters]);

  const selectAnimal = useCallback((id: string) => {
    const c = countries.find((x) => x.id === id);
    if (!c) return;
    setSelectedId(id);
    setSearchQuery("");
    setActiveRegion("All");
    setIsOpen(false);
  }, [setSelectedId, setSearchQuery, setActiveRegion]);

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center md:pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-lg md:rounded-xl shadow-2xl md:border overflow-hidden flex flex-col max-h-[100dvh] md:max-h-none" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-4 md:py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr.search}
            className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
          />
          {(query || iucnFilters.length || classFilters.length) ? (
            <button onClick={() => { setQuery(""); setIucnFilters([]); setClassFilters([]); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          ) : null}
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border" style={{ background: 'var(--accent)', borderColor: 'var(--border)' }}>ESC</kbd>
        </div>

        {/* Active filters */}
        {(iucnFilters.length > 0 || classFilters.length > 0) && (
          <div className="flex flex-wrap gap-1 px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            {iucnFilters.map((f) => (
              <button key={f} onClick={() => toggleFilter(iucnFilters, setIucnFilters, f)}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border text-muted-foreground hover:bg-accent transition-colors" style={{ borderColor: 'var(--border)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: IUCN_CONFIG[f]?.bg ?? "#888" }} />
                {f} <X size={10} />
              </button>
            ))}
            {classFilters.map((f) => (
              <button key={f} onClick={() => toggleFilter(classFilters, setClassFilters, f)}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border text-muted-foreground hover:bg-accent transition-colors" style={{ borderColor: 'var(--border)' }}>
                {f} <X size={10} />
              </button>
            ))}
          </div>
        )}

        {/* IUCN filter chips */}
        <div className="flex gap-1 px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          {IUCN_FILTERS.map((f) => (
            <button key={f} onClick={() => toggleFilter(iucnFilters, setIucnFilters, f)}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                iucnFilters.includes(f) ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:bg-accent/80"
              }`}>
              <span className="w-2 h-2 rounded-full" style={{ background: iucnFilters.includes(f) ? "currentColor" : IUCN_CONFIG[f]?.bg ?? "#888" }} />
              {f}
            </button>
          ))}
        </div>

        {/* Class filter chips */}
        <div className="flex flex-wrap gap-1 px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          {ALL_CLASSES.map((c) => (
            <button key={c} onClick={() => toggleFilter(classFilters, setClassFilters, c)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                classFilters.includes(c) ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:bg-accent/80"
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[40vh] overflow-y-auto scrollbar-thin">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            results.map((c) => {
              const code = conservationToCode(c.conservationStatus);
              const iucn = IUCN_CONFIG[code];
              return (
                <button
                  key={c.id}
                  onClick={() => selectAnimal(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 md:py-2 text-left text-sm hover:bg-accent transition-colors ${
                    selectedId === c.id ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: iucn?.bg ?? "#888" }} />
                  <span className="sr-only">{c.conservationStatus}</span>
                  <span className="text-lg">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground">{c.animal}</div>
                    <div className="text-[11px] text-muted-foreground italic truncate">{c.scientificName}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{c.country}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
