"use client"
import React from 'react';

/*
 * Legacy map shell: mixes maplibre instance refs with manual memoization.
 * React Compiler cannot preserve it (preserve-manual-memoization) — opt the
 * rule off for this file only until the component is compiler-friendly.
 */
/* eslint-disable react-hooks/preserve-manual-memoization */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GitCompareArrows, Volume2, Volume1, BookOpen } from "lucide-react";
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
import { IUCN_CONFIG, statusCodeFor, IUCN_FALLBACK } from "../lib/iucn";
import { CLUSTER_COLOR } from "../lib/mapColors";
import IucnDot from "./IucnDot";
import MapControls from "./MapControls";
import { useAnimalMedia } from "../hooks/useAnimalMedia";
import { translateCountry, getEntryFunFacts } from "../lib/profileText";
import { useFavorites } from "../hooks/useFavorites";
import HeartButton from "./HeartButton";
import MobileDetailPanel from "./MobileDetailPanel";
import MapSkeleton from "./MapSkeleton";
import Image from "next/image";
import Link from "next/link";
import { CONTINENT_COLORS } from "../lib/regions";

/** Keyless basemap styles — no API key or usage cap. Color/Minimal use
 *  OpenFreeMap (https://openfreemap.org, ships glyphs for cluster labels);
 *  Dark uses Carto Dark Matter for a true dark basemap instead of a CSS
 *  invert hack that also tinted the canvas-drawn cluster bubbles. Carto
 *  tiles live under *.basemaps.cartocdn.com — keep CSP connect-src in
 *  public/_headers in sync when touching this list. */
const OFM_BASE = "https://tiles.openfreemap.org/styles";

const STYLES: Record<MapStyleName, string> = {
  voyager: `${OFM_BASE}/liberty`,
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  minimal: `${OFM_BASE}/positron`,
};

/** CSS filter applied to the .maplibregl-canvas per style. Only Minimal
 *  still needs one (a desaturated Positron); Dark is a native dark style. */
const MAP_CANVAS_FILTERS: Record<MapStyleName, string> = {
  voyager: "none",
  dark: "none",
  minimal: "grayscale(1) brightness(1.02) contrast(0.92)",
};

/** Era Purba tints the basemap toward a warm fossil palette (dinosaur-era
 *  spec). Dark needs a much stronger lift — sepia over a near-black canvas
 *  is invisible — so the warm filter is chosen per style. */
const PREHISTORIC_FILTER_LIGHT =
  "sepia(0.35) saturate(0.9) hue-rotate(-10deg) brightness(1.03)";
const PREHISTORIC_FILTER_DARK =
  "sepia(0.5) hue-rotate(-18deg) saturate(1.05) brightness(1.3) contrast(0.95)";

function composeCanvasFilter(style: MapStyleName, prehistoric: boolean): string {
  if (!prehistoric) return MAP_CANVAS_FILTERS[style];
  const warm =
    style === "dark" ? PREHISTORIC_FILTER_DARK : PREHISTORIC_FILTER_LIGHT;
  const base = MAP_CANVAS_FILTERS[style];
  return base === "none" ? warm : `${base} ${warm}`;
}

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

/** Maps conservation status string to IUCN code (unmapped → DD) */
function getIucnCode(conservationStatus: string): string {
  return statusCodeFor(conservationStatus);
}

/** Returns the background color for a conservation status */
function iucnColor(status: string): string {
  return IUCN_CONFIG[getIucnCode(status)]?.bg ?? IUCN_FALLBACK;
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
  const { isFavorite } = useFavorites();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasImgError, setHasImgError] = useState(false);
  /* Viewport size tracked in state so the popup reacts to window resizes
     instead of reading window.innerWidth during render. */
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const read = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  const popupRef = useRef<HTMLDivElement>(null);
  const CARD_W = 260;
  const IMG_SIZE = 200;
  /* Real popup height (content varies per species; the estimate overshoots
     and pushed the card past the viewport bottom). ResizeObserver delivers
     the initial measurement on observe — no synchronous setState needed. */
  const [popupH, setPopupH] = useState(520);
  useLayoutEffect(() => {
    const el = popupRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setPopupH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [selected, imageLoading, imageUrl]);

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

  /* Container resizes change projections but fire no move event — refresh
     marker screen positions so the popup follows. */
  const onMapResize = useCallback(() => {
    updateMarkerScreenPos(filtered);
  }, [updateMarkerScreenPos, filtered]);

  /* Selections from outside the map don't move the camera themselves
     (focusTarget flies it, but jumps/short flights may end without another
     move event). Reproject once per list/load change so the popup never
     stalls waiting for a map event. Deferred to a frame like onMapMove —
     synchronous setState here trips the cascading-render rule. */
  useEffect(() => {
    if (!isMapLoaded) return;
    const raf = requestAnimationFrame(() => updateMarkerScreenPos(filtered));
    return () => cancelAnimationFrame(raf);
  }, [isMapLoaded, filtered, updateMarkerScreenPos]);

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
      "circle-color": CLUSTER_COLOR[atlasMode],
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
  /* Apply CSS filter to map canvas whenever style or atlas mode changes */
  useEffect(() => {
    const canvas = mapRef.current?.getMap()?.getCanvas();
    if (canvas) canvas.style.filter = composeCanvasFilter(mapStyle, isPrehistoric);
  }, [mapStyle, isPrehistoric]);

  /* Camera follows selections made outside the map (sidebar, ⌘K palette,
     mobile sheet). The nonce lets the same coordinates re-trigger. Marker
     clicks keep their existing instant recenter — only out-of-map selection
     needs the camera to travel. */
  const focusTarget = useMapStore((s) => s.focusTarget);
  useEffect(() => {
    if (!focusTarget) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const zoom = Math.max(map.getZoom(), 4);
    const center: [number, number] = [focusTarget.lng, focusTarget.lat];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      map.jumpTo({ center, zoom });
    } else {
      map.flyTo({ center, zoom });
    }
  }, [focusTarget]);

  return (
    <main className="relative flex-1">
      {!isMapLoaded && <MapSkeleton />}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMapMove}
        onResize={onMapResize}
        onLoad={() => {
          setIsMapLoaded(true);
          /* Apply CSS filter to canvas for the active style + atlas mode */
          const canvas = mapRef.current?.getMap()?.getCanvas();
          if (canvas) canvas.style.filter = composeCanvasFilter(mapStyle, isPrehistoric);
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

        {/* Markers: paleo-art thumbnails in prehistoric mode, emoji in
            wildlife mode. Both render at every zoom — at low zoom the canvas
            cluster bubbles stay visible underneath as the density aggregate;
            do not gate these on zoom, the world view must show species. */}
        {filtered.map((c) => {
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
              className={`pet-marker ${
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
                <div className="mt-1.5 text-micro text-muted-foreground leading-relaxed line-clamp-2">
                  {getEntryFunFacts(hovered, locale)[0]}
                </div>
                <div
                  className="mt-2 text-micro px-2 py-0.5 rounded-full inline-block font-medium"
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
          if (!viewport || viewport.w < 768) return null;
          const ph = popupH;
          const pw = CARD_W;
          const GAP = 16;
          const vw = viewport.w;
          const vh = viewport.h;
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
              {/* Nearly-opaque glass: the card floats over map labels and
                  markers, so body text needs a solid-enough backdrop */}
              <div className="glass-card rounded-2xl shadow-xl p-4 text-sm" style={{ width: CARD_W, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', background: 'color-mix(in srgb, var(--card) 94%, transparent)' }}>
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
                <div className="mt-1 flex items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold leading-tight text-foreground font-heading">{selected.animal}</div>
                    <div className="text-micro text-muted-foreground italic leading-tight mt-0.5">{selected.scientificName}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl">{selected.emoji}</span>
                  <span className="flex-1" />
                  <button onClick={playSound} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors" style={{ background: 'var(--accent)' }} aria-label={isPlaying ? 'Playing animal sound' : 'Play animal sound'}>
                    {isPlaying ? <Volume2 size={14} className="animate-pulse text-primary" /> : <Volume1 size={14} className="text-muted-foreground" />}
                  </button>
                  <HeartButton animalId={selected.id} animalName={selected.animal} size={14} className="w-9 h-9" style={{ background: 'var(--accent)' }} />
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
                  <div className="text-micro px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent)', color: 'var(--natura-emerald)' }}>
                    {tr.classification[selected.classification as keyof typeof tr.classification] ?? selected.classification}
                  </div>
                  <div
                    className="text-micro px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: `${IUCN_CONFIG[getIucnCode(selected.conservationStatus)]?.bg ?? IUCN_FALLBACK}20`,
                      color: IUCN_CONFIG[getIucnCode(selected.conservationStatus)]?.bg ?? IUCN_FALLBACK,
                    }}
                  >
                    {getIucnCode(selected.conservationStatus)} · {tr.conservation[selected.conservationStatus as keyof typeof tr.conservation] ?? selected.conservationStatus}
                  </div>
                  <div className="text-micro px-2 py-0.5 rounded-full font-medium" style={{ background: `${CONTINENT_COLORS[selected.region]}15`, color: CONTINENT_COLORS[selected.region] }}>
                    {tr.regions[selected.region as keyof typeof tr.regions] ?? selected.region}
                  </div>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-micro text-muted-foreground leading-relaxed">
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
                    className="mt-2 inline-flex items-center gap-1 text-micro font-semibold text-primary hover:underline"
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
        {/* Nearly-opaque backdrop: the plain glass card let bright map labels
            and markers bleed through as ghost fragments over the codes. */}
        <div className="glass-card rounded-xl shadow-sm px-3 py-2.5" style={{ overflow: "visible", background: 'color-mix(in srgb, var(--card) 97%, transparent)' }}>
          <div className="text-micro font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" title={tr.iucnInfo.intro}>
            IUCN Conservation Status
          </div>
          <div className="grid grid-cols-4 gap-x-3 gap-y-1.5" style={{ overflow: "visible" }}>
            {["LC", "NT", "VU", "EN", "CR", "EX", "DD", "NE"].map((code) => {
              const config = IUCN_CONFIG[code];
              const info = tr.iucnInfo[code as keyof typeof tr.iucnInfo];
              return (
                <div key={code} className="flex items-center gap-1.5 group cursor-help relative" title={config?.label ?? code}>
                  <IucnDot
                    code={code}
                    color={config?.bg}
                    size={10}
                    className="transition-transform duration-200 group-hover:scale-125"
                  />
                  <span className="text-micro text-foreground/80 font-medium group-hover:text-foreground transition-colors">{code}</span>
                  {/* Educational tooltip: full name + what it means */}
                  <div
                    className="absolute bottom-full left-0 mb-1.5 w-52 normal-case tracking-normal text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ zIndex: 50 }}
                  >
                    <div className="glass-card rounded-lg px-2.5 py-2 shadow-lg">
                      <div className="text-micro font-bold text-foreground">{config?.label ?? code}</div>
                      <div className="mt-0.5 text-micro leading-snug text-muted-foreground">{info}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 text-micro text-muted-foreground">Zoom: {viewState.zoom.toFixed(1)}x</div>
        </div>
      </div>
    </main>
  );
}
