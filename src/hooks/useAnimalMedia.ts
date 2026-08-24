"use client";

import { useState, useEffect } from "react";

interface AnimalMediaState {
  name: string | null;
  imageUrl: string | null;
}

/** Fetches Wikipedia thumbnail image for an animal */
export function useAnimalMedia(
  animalName: string | null,
  wikiUrl?: string,
  preferredImageUrl?: string | null
): { imageUrl: string | null; imageLoading: boolean } {
  const [state, setState] = useState<AnimalMediaState>({ name: null, imageUrl: null });

  useEffect(() => {
    if (!animalName || preferredImageUrl) return;

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
        if (!cancelled) setState({ name: animalName, imageUrl: data.thumbnail?.source ?? null });
      })
      .catch((err) => {
        console.error("Wikipedia fetch failed:", err);
        if (!cancelled) setState({ name: animalName, imageUrl: null });
      });

    return () => { cancelled = true; };
  }, [animalName, wikiUrl, preferredImageUrl]);

  if (!animalName) return { imageUrl: null, imageLoading: false };
  if (preferredImageUrl) return { imageUrl: preferredImageUrl, imageLoading: false };
  if (state.name !== animalName) return { imageUrl: null, imageLoading: true };

  return { imageUrl: state.imageUrl, imageLoading: false };
}
