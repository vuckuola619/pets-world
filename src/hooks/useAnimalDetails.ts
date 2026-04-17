"use client";

import { useState, useEffect, useRef } from "react";
import { fetchAnimalDetails, type ApiNinjasAnimal } from "../lib/apiNinjas";

interface AnimalDetailsState {
  details: ApiNinjasAnimal | null;
  loading: boolean;
  error: boolean;
}

/**
 * Hook to fetch enriched animal details from API-Ninjas.
 * Includes session caching and graceful fallback.
 */
export function useAnimalDetails(animalName: string | null): AnimalDetailsState {
  const [details, setDetails] = useState<ApiNinjasAnimal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const prevName = useRef(animalName);

  // Reset state synchronously when animalName changes
  if (prevName.current !== animalName) {
    prevName.current = animalName;
    setDetails(null);
    setLoading(!!animalName);
    setError(false);
  }

  useEffect(() => {
    if (!animalName) return;

    let cancelled = false;

    fetchAnimalDetails(animalName)
      .then((data) => {
        if (!cancelled) {
          setDetails(data);
          setError(!data);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [animalName]);

  return { details, loading, error };
}
