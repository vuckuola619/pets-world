"use client"
import { useCallback, useSyncExternalStore } from "react";

/** Subset of the beforeinstallprompt event we need */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Module-level capture: `beforeinstallprompt` fires once per page load and
 *  both consumers (desktop header + mobile sheet) share the same event. */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let canInstall = false;
const subscribers = new Set<() => void>();

function setState(next: boolean): void {
  canInstall = next;
  subscribers.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the browser's own mini-infobar; we surface our own button.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    setState(true);
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    setState(false);
  });
}

/** Tracks PWA installability and triggers the native install prompt.
 *  SSR-safe: renders as not-installable on the server. iOS Safari never
 *  fires beforeinstallprompt, so the button simply never appears there. */
export function useInstallPrompt(): { canInstall: boolean; promptInstall: () => void } {
  const installable = useSyncExternalStore(
    (listener) => {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    () => canInstall,
    () => false,
  );

  const promptInstall = useCallback(() => {
    if (!deferredPrompt) return;
    void deferredPrompt.prompt().then(async () => {
      const choice = await deferredPrompt?.userChoice;
      if (choice?.outcome === "accepted") {
        deferredPrompt = null;
        setState(false);
      }
    });
  }, []);

  return { canInstall: installable, promptInstall };
}
