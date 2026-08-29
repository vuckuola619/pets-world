"use client"
import { useEffect } from "react";
import { useMapStore } from "../store/useMapStore";

const LOCALE_KEY = "wildlife-locale";

/**
 * Restores the persisted locale after hydration (prerendered HTML is always
 * English, so reading it during render would cause a hydration mismatch) and
 * keeps <html lang> in sync with the active locale.
 */
export default function LocaleSync(): null {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY);
      if (saved === "id" || saved === "en") {
        if (useMapStore.getState().locale !== saved) {
          useMapStore.getState().setLocale(saved);
        } else {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // localStorage unavailable — keep default locale
    }
  }, []);
  return null;
}
