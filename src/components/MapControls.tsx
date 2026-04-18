"use client"
import React from 'react';

import { useCallback } from "react";
import { Plus, Minus, RotateCcw, Layers } from "lucide-react";
import { useMapStore, type MapStyleName } from "../store/useMapStore";

const mapStyleLabels: Record<MapStyleName, string> = {
  voyager: "🗺️ Color",
  dark: "🌙 Dark",
  satellite: "✦ Minimal",
};

interface MapControlsProps {
  viewState: { longitude: number; latitude: number; zoom: number };
  setViewState: React.Dispatch<React.SetStateAction<{ longitude: number; latitude: number; zoom: number }>>;
  onResetView: () => void;
}

/** Premium map zoom, reset, and style controls */
export default function MapControls({ viewState, setViewState, onResetView }: MapControlsProps): React.JSX.Element {
  const { mapStyle, setMapStyle } = useMapStore();

  const zoomIn = useCallback(() => {
    setViewState((v) => ({ ...v, zoom: Math.min(v.zoom + 1, 18) }));
  }, [setViewState]);

  const zoomOut = useCallback(() => {
    setViewState((v) => ({ ...v, zoom: Math.max(v.zoom - 1, 1) }));
  }, [setViewState]);

  const cycleMapStyle = useCallback(() => {
    const styles: MapStyleName[] = ["voyager", "dark", "satellite"];
    const idx = (styles.indexOf(mapStyle) + 1) % styles.length;
    setMapStyle(styles[idx]);
  }, [mapStyle, setMapStyle]);

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
      <button
        onClick={zoomIn}
        className="glass-card map-control-btn rounded-xl w-11 h-11 md:w-10 md:h-10 flex items-center justify-center text-foreground/70 hover:text-foreground transition-all duration-200"
        title="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={zoomOut}
        className="glass-card map-control-btn rounded-xl w-11 h-11 md:w-10 md:h-10 flex items-center justify-center text-foreground/70 hover:text-foreground transition-all duration-200"
        title="Zoom out"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={onResetView}
        className="glass-card map-control-btn rounded-xl w-11 h-11 md:w-10 md:h-10 flex items-center justify-center text-foreground/70 hover:text-foreground transition-all duration-200"
        title="Reset view"
      >
        <RotateCcw size={16} />
      </button>
      <button
        onClick={cycleMapStyle}
        className="glass-card map-control-btn rounded-xl px-3 h-11 md:h-10 flex items-center justify-center text-xs font-medium text-foreground/70 hover:text-foreground gap-1.5 transition-all duration-200"
        title="Switch map style"
      >
        <Layers size={14} />
        <span className="hidden md:inline">{mapStyleLabels[mapStyle]}</span>
      </button>
    </div>
  );
}
