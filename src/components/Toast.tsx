"use client"
import React, { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "../lib/motion";
import { useToastStore, type Toast } from "../store/useToastStore";
import { useMapStore } from "../store/useMapStore";
import { t } from "../lib/i18n";

const TOAST_DURATION = 3200;

/** One auto-dismissing toast pill */
function ToastItem({ toast }: { toast: Toast }): React.JSX.Element {
  const locale = useMapStore((s) => s.locale);
  const dismissToast = useToastStore((s) => s.dismissToast);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [dismissToast, toast.id]);

  return (
    <motion.div
      layout
      role="status"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      className="glass-card pointer-events-auto rounded-full px-4 py-2 text-sm font-medium text-foreground shadow-lg"
    >
      {t(locale).toasts[toast.key]}
    </motion.div>
  );
}

/** Fixed bottom-center viewport for transient app feedback. Mounted once in
 *  the root layout; any client component can push via useToastStore. */
export default function ToastViewport(): React.JSX.Element {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
