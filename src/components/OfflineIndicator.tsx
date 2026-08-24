"use client"
import React from 'react';

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

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

/** Shows a toast notification when the browser reports an offline state */
export default function OfflineIndicator(): React.JSX.Element | null {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineStatus,
    getServerOnlineStatus
  );

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="glass-card rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium text-amber-600 dark:text-amber-400">
        <WifiOff size={16} />
        <span>You are offline</span>
      </div>
    </div>
  );
}
