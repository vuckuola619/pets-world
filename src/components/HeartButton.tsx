"use client"
import React from 'react';

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import { Heart } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";
import { useMapStore } from "../store/useMapStore";
import { t } from "../lib/i18n";

interface HeartButtonProps {
  animalId: string;
  animalName: string;
  /** Icon size in px */
  size?: number;
  /** Extra classes on the button (background, padding, positioning) */
  className?: string;
  style?: React.CSSProperties;
}

/** Resolve the Natura celebration palette from CSS variables so confetti
 *  always matches the active theme (light/dark/prehistoric). */
function celebrationColors(): string[] | undefined {
  if (typeof window === 'undefined') return undefined;
  const styles = getComputedStyle(document.documentElement);
  const colors = ['--natura-emerald', '--natura-ocean', '--natura-amber', '--natura-coral', '--natura-sage']
    .map((name) => styles.getPropertyValue(name).trim())
    .filter(Boolean);
  return colors.length > 0 ? colors : undefined;
}

/** Small one-shot burst from the button — reserved for first-favorite and
 *  quiz celebrations (rare moments only). canvas-confetti respects
 *  disableForReducedMotion, so reduced-motion users get a static highlight. */
export function burstConfetti(el: HTMLElement, scale = 1): void {
  const rect = el.getBoundingClientRect();
  confetti({
    particleCount: Math.round(60 * scale),
    spread: 65,
    startVelocity: 26,
    scalar: 0.85 * scale,
    ticks: 130,
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    },
    colors: celebrationColors(),
    disableForReducedMotion: true,
  });
}

/**
 * Shared favorite toggle with spring pop + one-shot ring burst so every
 * favorite surface (sidebar rows, map popup, mobile panel) feels identical.
 * The very first favorite ever fires a small confetti celebration.
 */
export default function HeartButton({
  animalId,
  animalName,
  size = 18,
  className = "w-10 h-10",
  style,
}: HeartButtonProps): React.JSX.Element {
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const locale = useMapStore((s) => s.locale);
  const tr = t(locale);
  const reduceMotion = useReducedMotion();
  const isFav = isFavorite(animalId);
  const [burstKey, setBurstKey] = useState(0);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Never activate an enclosing row/card — the heart only toggles itself
    e.stopPropagation();
    const isFirstFavoriteEver = !isFav && favorites.length === 0;
    if (!isFav) setBurstKey((k) => k + 1);
    toggleFavorite(animalId);
    if (isFirstFavoriteEver) burstConfetti(e.currentTarget);
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileTap={reduceMotion ? undefined : { scale: 0.85 }}
      whileHover={reduceMotion ? undefined : { scale: 1.12 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className={`relative flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={style}
      aria-label={isFav ? tr.favorites.removeFromFavorites : tr.favorites.addToFavorites}
      aria-pressed={isFav}
      data-testid={`heart-${animalId}`}
    >
      <Heart
        size={size}
        fill={isFav ? "currentColor" : "none"}
        className={`pointer-events-none transition-colors duration-200 ${
          isFav ? "text-[var(--natura-coral)]" : "text-muted-foreground"
        }`}
      />
      {burstKey > 0 && <span key={burstKey} className="heart-ring" aria-hidden />}
    </motion.button>
  );
}
