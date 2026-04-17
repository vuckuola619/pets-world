"use client";

import { useState, useEffect, useRef } from "react";

/** Fetches Wikipedia thumbnail image for an animal name */
export function useAnimalMedia(animalName: string | null): { imageUrl: string | null; imageLoading: boolean } {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const prevName = useRef(animalName);

  // Reset state synchronously when animalName changes (before effect runs)
  if (prevName.current !== animalName) {
    prevName.current = animalName;
    setImageUrl(null);
    setImageLoading(!!animalName);
  }

  useEffect(() => {
    if (!animalName) return;

    let cancelled = false;

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(animalName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.thumbnail?.source) setImageUrl(data.thumbnail.source);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });

    return () => { cancelled = true; };
  }, [animalName]);

  return { imageUrl, imageLoading };
}
