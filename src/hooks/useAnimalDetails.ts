"use client";

import { useState, useEffect } from "react";
import { fetchAnimalDetails, type ApiNinjasAnimal } from "../lib/apiNinjas";

interface AnimalDetailsState {
  details: ApiNinjasAnimal | null;
  loading: boolean;
  error: boolean;
}

interface AnimalDetailsCache {
  name: string | null;
  details: ApiNinjasAnimal | null;
  error: boolean;
}

/**
 * Hook to fetch enriched animal details from API-Ninjas.
 * Includes session caching and graceful fallback.
 */
export function useAnimalDetails(animalName: string | null): AnimalDetailsState {
  const [state, setState] = useState<AnimalDetailsCache>({
    name: null,
    details: null,
    error: false,
  });

  useEffect(() => {
    if (!animalName) return;

    let cancelled = false;

    fetchAnimalDetails(animalName)
      .then((data) => {
        if (!cancelled) {
          setState({ name: animalName, details: data, error: !data });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ name: animalName, details: null, error: true });
      });

    return () => { cancelled = true; };
  }, [animalName]);

  if (!animalName) return { details: null, loading: false, error: false };
  if (state.name !== animalName) return { details: null, loading: true, error: false };

  return { details: state.details, loading: false, error: state.error };
}
