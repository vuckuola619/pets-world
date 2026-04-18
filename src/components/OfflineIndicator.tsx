"use client"
import React from 'react';

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

/** Shows a toast notification when going offline/online */
export default function OfflineIndicator(): React.JSX.Element | null {
  const [isOffline, setIsOffline] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setMessage("Back online");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setMessage("You are offline");
      setShowToast(true);
    };

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
      setMessage("You are offline");
      setShowToast(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showToast) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div
        className={`glass-card rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium ${
          isOffline ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
        <span>{message}</span>
        {!isOffline && (
          <button
            onClick={() => setShowToast(false)}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1 text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
