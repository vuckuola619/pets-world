"use client"
import React from 'react';

/*
 * Legacy map shell: mixes maplibre instance refs with manual memoization.
 * React Compiler cannot preserve it (preserve-manual-memoization) — opt the
 * rule off for this file only until the component is compiler-friendly.
 */
/* eslint-disable react-hooks/preserve-manual-memoization */

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, GitCompareArrows, Volume2, Volume1, BookOpen } from "lucide-react";
import Map, { Source, Layer, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef, MapLayerMouseEvent } from "react-map-gl/maplibre";
import { type AnimalEntry } from "../data/countries";
import { useMapStore, type MapStyleName } from "../store/useMapStore";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { getAtlasRecords } from "../hooks/useAtlasAnimals";
import { localDinoThumb } from "../lib/wikiImages";
import { audioService } from "./AudioService";
import { t } from "../lib/i18n";
import { IUCN_CONFIG, STATUS_CODE } from "../lib/iucn";
import MapControls from "./MapControls";
import { useAnimalMedia } from "../hooks/useAnimalMedia";
import { translateCountry, getEntryFunFacts } from "../lib/profileText";
import { useFavorites } from "../hooks/useFavorites";
import MobileDetailPanel from "./MobileDetailPanel";
import MapSkeleton from "./MapSkeleton";
import Image from "next/image";
import Link from "next/link";
import { CONTINENT_COLORS } from "../lib/regions";

/** Keyless OpenFreeMap vector styles (https://openfreemap.org) — free with no
 *  API key or usage cap; the hosted style ships glyphs for cluster labels. */
const OFM_BASE = "https://tiles.openfreemap.org/styles";

const STYLES: Record<MapStyleName, string> = {
  voyager: `${OFM_BASE}/liberty`,
  dark: `${OFM_BASE}/positron`,
  satellite: `${OFM_BASE}/positron`,
};

/** CSS filter applied to the .maplibregl-canvas for each style.
 *  OpenFreeMap has no native dark style: Dark mode inverts Positron's canvas,
 *  Minimal (satellite key) desaturates it. */
const MAP_CANVAS_FILTERS: Record<MapStyleName, string> = {
  voyager: "none",
  dark: "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.85)",
  satellite: "grayscale(1) brightness(1.02) contrast(0.92)",
};

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

/** Props for the MapView component */
interface MapViewProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
}

/** Maps conservation status string to IUCN code */
function getIucnCode(conservationStatus: string): string {
  return STATUS_CODE[conservationStatus] || 'LC';
}

/** Returns the background color for a conservation status */
function iucnColor(status: string): string {
  return IUCN_CONFIG[getIucnCode(status)]?.bg ?? '#888';
}

/** Interactive map with markers, clustering, and detail popups */
export default function MapView({ viewState, setViewState }: MapViewProps): React.JSX.Element {
  const mapRef = useRef<MapRef>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const {
    selectedId, hoveredId, sidebarHoveredId, mapStyle, locale, atlasMode,
    setSelectedId, setHoveredId, setMobileOpen, compareIds, addCompare, removeCompare,
  } = useMapStore();
  const isPrehistoric = atlasMode === "prehistoric";
  const atlasRecords = getAtlasRecords(atlasMode);
  const tr = t(locale);
  const filtered = useFilteredAnimals();
  const selected = selectedId ? atlasRecords.find((c) => c.id === selectedId) ?? null : null;
  const hovered = hoveredId ? atlasRecords.find((c) => c.id === hoveredId) ?? null : null;
  const { imageUrl, imageLoading } = useAnimalMedia(selected?.animal ?? null, selected?.wikiUrl, selected?.imageUrl);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasImgError, setHasImgError] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const CARD_W = 260;
  const IMG_SIZE = 200;

  // Positions are refreshed from map events (load, move, hover, click) — a
  // popup only ever shows after one of those, so no render-time projection.
  const [markerScreenPos, setMarkerScreenPos] = useState<Record<string, { x: number; y: number }>>({});
  const updateMarkerScreenPos = useCallback((list: AnimalEntry[]) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const c of list) {
      const p = map.project([c.lng, c.lat]);
      next[c.id] = { x: p.x, y: p.y };
    }
    setMarkerScreenPos(next);
  }, []);

  // Coalesce map-move updates into one animation frame: without this every
  // pan frame triggered multiple synchronous full-tree renders.
  const moveRafRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(moveRafRef.current), []);

  const onMapMove = useCallback((evt: { viewState: ViewState }) => {
    if (moveRafRef.current) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = 0;
      setViewState(evt.viewState);
      updateMarkerScreenPos(filtered);
    });
  }, [setViewState, updateMarkerScreenPos, filtered]);

  function projectToScreen(id: string): { x: number; y: number } | null {
    return markerScreenPos[id] ?? null;
  }

  function getPopupPosition(
    screenPos: { x: number; y: number },
    pw: number, ph: number,
    cw: number, ch: number,
    offset = 20
  ) {
    // Center popup on marker, then clamp to viewport
    let left = screenPos.x - pw / 2;
    let top = screenPos.y - ph / 2 - 30; // slightly above center

    // Clamp to viewport
    left = Math.max(8, Math.min(left, cw - pw - 8));
    top = Math.max(8, Math.min(top, ch - ph - 8));

    return { left, top };
  }

  const playSound = useCallback(() => {
    if (!selected) return;
    setIsPlaying(true);
    audioService.playAnimalRepresentativeSound(selected.animal, selected.classification);
    setTimeout(() => setIsPlaying(false), 2000);
  }, [selected]);

  const onMarkerClick = useCallback((c: AnimalEntry) => {
    audioService.playClickSound();
    setSelectedId(selectedId === c.id ? null : c.id);
    setViewState((v) => ({
      ...v,
      longitude: c.lng,
      latitude: c.lat,
      zoom: Math.max(v.zoom, 4),
    }));
  }, [setSelectedId, selectedId, setViewState]);

  const onMarkerHover = useCallback((c: AnimalEntry) => {
    if (hoveredId !== c.id) setHoveredId(c.id);
  }, [hoveredId, setHoveredId]);

  const resetView = useCallback(() => {
    setViewState({ longitude: 20, latitude: 20, zoom: 2 });
    setSelectedId(null);
    setHoveredId(null);
    audioService.playClickSound();
  }, [setSelectedId, setHoveredId, setViewState]);

  // Build GeoJSON for clustering
  const geojson = {
    type: "FeatureCollection" as const,
    features: filtered.map((c) => ({
      type: "Feature" as const,
      properties: {
        id: c.id,
        iucnCode: getIucnCode(c.conservationStatus),
        iucnColor: iucnColor(c.conservationStatus),
      },
      geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
    })),
  };

  // Cluster layer styles
  const clusterLayer: maplibregl.LayerSpecification = {
    id: "clusters",
    type: "circle",
    source: "animals",
    filter: ["has", "point_count"],
    layout: { visibility: isPrehistoric ? "none" : "visible" },
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 14, 100, 20, 750, 28],
      "circle-color": "#2e7d54",
      "circle-opacity": 0.85,
      "circle-stroke-width": 3,
      "circle-stroke-color": "rgba(255,255,255,0.8)",
    },
  };

  const clusterCountLayer: maplibregl.LayerSpecification = {
    id: "cluster-count",
    type: "symbol",
    source: "animals",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
      // Carto basemaps serve Noto fonts
      "text-font": ["Noto Sans Regular"],
      visibility: isPrehistoric ? "none" : "visible",
    },
    paint: {
      "text-color": "#fff",
    },
  };

  const unclusteredPointLayer: maplibregl.LayerSpecification = {
    id: "unclustered-point",
    type: "circle",
    source: "animals",
    filter: ["!", ["has", "point_count"]],
    minzoom: 7.5,
    layout: { visibility: isPrehistoric ? "none" : "visible" },
    paint: {
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "selected"], false], 10,
        ["boolean", ["feature-state", "hover"], false], 8,
        6
      ],
      "circle-color": ["get", "iucnColor"],
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255,255,255,0.9)",
      "circle-opacity": 0.9,
    },
  };

  const onMapClick = useCallback((evt: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    /* Guard: overlay layers register after the (remote) style finishes loading */
    if (!map.getLayer("unclustered-point") && !map.getLayer("clusters")) return;

    const features = map.queryRenderedFeatures(evt.point, {
      layers: ["unclustered-point"],
    });
    if (features.length > 0) {
      const id = features[0].properties?.id;
      if (id) {
        audioService.playClickSound();
        setSelectedId(id);
        const c = atlasRecords.find((x) => x.id === id);
        if (c) {
          setViewState((v) => ({
            ...v,
            longitude: c.lng,
            latitude: c.lat,
            zoom: Math.max(v.zoom, 4),
          }));
        }
      }
      return;
    }

    const clusterFeatures = map.queryRenderedFeatures(evt.point, {
      layers: ["clusters"],
    });
    if (clusterFeatures.length > 0) {
      const clusterId = clusterFeatures[0].properties?.cluster_id;
      const source = map.getSource("animals") as maplibregl.GeoJSONSource;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        const coords = (clusterFeatures[0].geometry as GeoJSON.Point).coordinates;
        if (prefersReducedMotion) {
          map.jumpTo({ center: coords as [number, number], zoom });
        } else {
          map.flyTo({ center: coords as [number, number], zoom });
        }
      });
    }
  }, [setSelectedId, setViewState, atlasRecords]);

  // Cursor on hover
  const onMapMouseMove = useCallback((evt: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    /* Guard: only query layers that exist (avoids error during initial load) */
    const layers = ["unclustered-point", "clusters"].filter((id) => map.getLayer(id));
    if (!layers.length) return;
    const features = map.queryRenderedFeatures(evt.point, { layers });
    map.getCanvas().style.cursor = features.length ? "pointer" : "";
  }, []);
  /* Apply CSS filter to map canvas whenever style changes */
  useEffect(() => {
    const canvas = mapRef.current?.getMap()?.getCanvas();
    if (canvas) canvas.style.filter = MAP_CANVAS_FILTERS[mapStyle];
  }, [mapStyle]);

  return (
    <main className="relative flex-1">
      {!isMapLoaded && <MapSkeleton />}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMapMove}
        onLoad={() => {
          setIsMapLoaded(true);
          /* Apply CSS filter to canvas for dark/minimal modes */
          const canvas = mapRef.current?.getMap()?.getCanvas();
          if (canvas) canvas.style.filter = MAP_CANVAS_FILTERS[mapStyle];
          updateMarkerScreenPos(filtered);
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={STYLES[mapStyle]}
        onClick={onMapClick}
        onMouseMove={onMapMouseMove}
      >
        <Source
          id="animals"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={8}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>

        {/* Markers: paleo-art thumbnails in prehistoric mode (the product),
            emoji in wildlife mode only once clusters dissolve (zoom >= 7.5)
            so each point is rendered by exactly one pipeline. */}
        {(isPrehistoric || viewState.zoom >= 7.5) && filtered.map((c) => {
          const photoUrl =
            isPrehistoric && c.imageKind === "photo" && c.imageUrl
              ? localDinoThumb(c.slug, 128)
              : null
          return (
          <Marker key={c.id} longitude={c.lng} latitude={c.lat} anchor="center">
            <button
              onClick={() => onMarkerClick(c)}
              onMouseEnter={() => onMarkerHover(c)}
              onMouseLeave={() => setHoveredId(null)}
              className={`pet-marker text-2xl md:text-3xl ${
                sidebarHoveredId === c.id ? "pet-marker-highlighted" : ""
              } ${selectedId === c.id ? "!scale-150" : ""} ${photoUrl ? "dino-photo-marker" : ""}`}
              data-continent={c.region}
              aria-label={`View ${c.animal}, ${c.conservationStatus}`}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="" loading="lazy" className="dino-photo-marker-img" />
              ) : (
                c.emoji
              )}
            </button>
          </Marker>
          )
        })}

        {hovered && !selected && (() => {
          const pos = projectToScreen(hovered.id);
          if (!pos) return null;
          return (
            <div
              className="hidden md:block animate-fade-in-scale"
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y - 12,
                transform: 'translate(-50%, -100%)',
                zIndex: 20,
                pointerEvents: 'auto',
              }}
            >
              <div className="glass-card rounded-xl p-3 min-w-[180px] shadow-lg">
                <div className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <span>{hovered.flag}</span>
                  <span>{translateCountry(hovered.country, locale)}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <span className="text-lg">{hovered.emoji}</span>
                  <span className="font-medium text-foreground">{hovered.animal}</span>
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {getEntryFunFacts(hovered, locale)[0]}
                </div>
                <div
                  className="mt-2 text-[10px] px-2 py-0.5 rounded-full inline-block font-medium"
                  style={{
                    background: `${CONTINENT_COLORS[hovered.region]}15`,
                    color: CONTINENT_COLORS[hovered.region],
                  }}
                >
                  {tr.regions[hovered.region as keyof typeof tr.regions] ?? hovered.region}
                </div>
              </div>
            </div>
          );
        })()}

        <MobileDetailPanel />

        {/* Desktop popup */}
        {selected && (() => {
          const pos = projectToScreen(selected.id);
          if (!pos) return null;
          if (window.innerWidth < 768) return null;
          const ph = 520;
          const pw = CARD_W;
          const GAP = 16;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          // Prefer right side, fallback to left if not enough space
          const fitsRight = pos.x + GAP + pw < vw - 8;
          const fitsLeft = pos.x - GAP - pw > 8;
          let left: number;
          if (fitsRight) {
            left = pos.x + GAP;
          } else if (fitsLeft) {
            left = pos.x - GAP - pw;
          } else {
            left = pos.x - pw / 2; // fallback center
          }
          // Vertically center on marker, clamp
          let top = pos.y - ph / 2;
          top = Math.max(8, Math.min(top, vh - ph - 8));
          return (
            <div
              ref={popupRef}
              className="hidden md:block fixed z-20 animate-fade-in-scale"
              style={{ left, top }}
            >
              <div className="glass-card rounded-2xl shadow-xl p-4 text-sm" style={{ width: CARD_W, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
                {/* Image */}
                <div
                  className="rounded-xl overflow-hidden mb-3"
                  style={{ width: IMG_SIZE, height: IMG_SIZE, margin: '0 auto', background: 'var(--accent)' }}
                >
                  {imageLoading || (!imageUrl || hasImgError) ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <span className="text-6xl">{selected.emoji}</span>
                    </div>
                  ) : (
                    <img
                      src={isPrehistoric && selected.imageKind === 'photo' ? localDinoThumb(selected.slug, 480) : imageUrl}
                      alt={selected.animal}
                      style={{ width: IMG_SIZE, height: IMG_SIZE, objectFit: 'cover', display: 'block' }}
                      onError={() => setHasImgError(true)}
                    />
                  )}
                </div>
                <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <span>{selected.flag}</span>
                  <span>{translateCountry(selected.country, locale)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl">{selected.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground font-[var(--font-heading)]">{selected.animal}</div>
                    <div className="text-[11px] text-muted-foreground italic">{selected.scientificName}</div>
                  </div>
                  <button onClick={playSound} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors" style={{ background: 'var(--accent)' }} aria-label={isPlaying ? 'Playing animal sound' : 'Play animal sound'}>
                    {isPlaying ? <Volume2 size={14} className="animate-pulse text-primary" /> : <Volume1 size={14} className="text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => toggleFavorite(selected.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                    style={{ background: 'var(--accent)' }}
                    aria-label={isFavorite(selected.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={14} fill={isFavorite(selected.id) ? '#ef4444' : 'none'} className={isFavorite(selected.id) ? 'text-red-500' : 'text-muted-foreground'} />
                  </button>
                  <button
                    onClick={() => compareIds.includes(selected.id) ? removeCompare(selected.id) : addCompare(selected.id)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors ${compareIds.includes(selected.id) ? 'text-primary' : 'text-muted-foreground'}`}
                    style={{ background: 'var(--accent)' }}
                    aria-label={compareIds.includes(selected.id) ? 'Remove from comparison' : 'Add to comparison'}
                  >
                    <GitCompareArrows size={14} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <div className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent)', color: 'var(--natura-emerald)' }}>
                    {tr.classification[selected.classification as keyof typeof tr.classification] ?? selected.classification}
                  </div>
                  <div
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: `${IUCN_CONFIG[STATUS_CODE[selected.conservationStatus] || 'LC']?.bg ?? '#888'}20`,
                      color: IUCN_CONFIG[STATUS_CODE[selected.conservationStatus] || 'LC']?.bg ?? '#888',
                    }}
                  >
                    {STATUS_CODE[selected.conservationStatus] || 'LC'} · {tr.conservation[selected.conservationStatus as keyof typeof tr.conservation] ?? selected.conservationStatus}
                  </div>
                  <div className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${CONTINENT_COLORS[selected.region]}15`, color: CONTINENT_COLORS[selected.region] }}>
                    {tr.regions[selected.region as keyof typeof tr.regions] ?? selected.region}
                  </div>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  {getEntryFunFacts(selected, locale).slice(0, 3).map((f, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="shrink-0 text-xs font-bold" style={{ color: CONTINENT_COLORS[selected.region] }}>{i + 1}.</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {selected.wikiUrl && (
                  <a
                    href={selected.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <BookOpen size={12} aria-hidden /> Wikipedia Reference
                  </a>
                )}
                <Link
                  href={`/animal/${selected.slug}`}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
                  }}
                >
                  Full Profile →
                </Link>
              </div>
            </div>
          );
        })()}
      </Map>

      <MapControls viewState={viewState} setViewState={setViewState} onResetView={resetView} />

      {/* IUCN Legend with full status names on hover */}
      <div className="hidden md:block absolute bottom-4 left-4 z-10">
        <div className="glass-card rounded-xl shadow-sm px-3 py-2.5" style={{ overflow: "visible" }}>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" title={tr.iucnInfo.intro}>
            IUCN Conservation Status
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5" style={{ overflow: "visible" }}>
            {["LC", "NT", "VU", "EN", "CR", "EX"].map((code) => {
              const config = IUCN_CONFIG[code];
              const info = tr.iucnInfo[code as keyof typeof tr.iucnInfo];
              return (
                <div key={code} className="flex items-center gap-1.5 group cursor-help relative" title={config?.label ?? code}>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/5 group-hover:scale-125 transition-transform duration-200"
                    style={{ background: config?.bg ?? "#888" }}
                  />
                  <span className="text-[10px] text-foreground/80 font-medium group-hover:text-foreground transition-colors">{code}</span>
                  {/* Educational tooltip: full name + what it means */}
                  <div
                    className="absolute bottom-full left-0 mb-1.5 w-52 normal-case tracking-normal text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ zIndex: 50 }}
                  >
                    <div className="glass-card rounded-lg px-2.5 py-2 shadow-lg">
                      <div className="text-[10px] font-bold text-foreground">{config?.label ?? code}</div>
                      <div className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{info}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground">Zoom: {viewState.zoom.toFixed(1)}x</div>
        </div>
      </div>
    </main>
  );
}
