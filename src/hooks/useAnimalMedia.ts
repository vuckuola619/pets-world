"use client";

import { useState, useEffect, useRef } from "react";

/** Fetches Wikipedia thumbnail image for an animal */
export function useAnimalMedia(animalName: string | null, wikiUrl?: string): { imageUrl: string | null; imageLoading: boolean } {
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

    // Use exactly the Wikipedia article ID if available, otherwise just encode the common name
    const wikiTitle = wikiUrl ? wikiUrl.split('/').pop() : encodeURIComponent(animalName);

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`, {
      headers: {
         'User-Agent': 'WorldWildlifeAtlas/1.1 (https://github.com/vuckuola619/pets-world)'
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.thumbnail?.source) setImageUrl(data.thumbnail.source);
      })
      .catch((err) => {
        console.error("Wikipedia fetch failed:", err);
      })
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });

    return () => { cancelled = true; };
  }, [animalName, wikiUrl]);

  return { imageUrl, imageLoading };
}
