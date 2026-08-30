"use client"
import React from 'react';

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT_EXPO } from "../lib/motion";
import { WifiOff } from "lucide-react";
import { useMapStore } from "../store/useMapStore";
import { t } from "../lib/i18n";

function subscribeOnlineStatus(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineStatus(): boolean {
  return navigator.onLine;
}

function getServerOnlineStatus(): boolean {
  return true;
}

/** Shows a toast notification when the browser reports an offline state.
 *  Enters and exits from the same top edge; icon pulses while offline. */
export default function OfflineIndicator(): React.JSX.Element {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineStatus,
    getServerOnlineStatus
  );
  const locale = useMapStore((s) => s.locale);
  const tr = t(locale);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        >
          <div className="glass-card rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium text-amber-600 dark:text-amber-400" role="status">
            <WifiOff size={16} style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
            <span>{tr.offline.offline}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
