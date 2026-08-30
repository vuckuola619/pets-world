"use client"
import React from 'react';

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { Search, Menu, X, Gamepad2, Download } from "lucide-react";
import Link from "next/link";
import { type AnimalEntry } from "../data/countries";
import { useMapStore } from "../store/useMapStore";
import { useAtlasData } from "../hooks/useAtlasAnimals";
import { useFilteredAnimals } from "../hooks/useAnimals";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { audioService } from "./AudioService";
import { t } from "../lib/i18n";

import { CONTINENT_COLORS } from "../lib/regions";

const SHEET_SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;

/** Mobile sidebar sheet with search, region filters, and animal list.
 *  Radix Dialog owns a11y; motion owns the slide-up/down and the
 *  drag-to-dismiss gesture from the grabber row. */
export default function MobileSidebar(): React.JSX.Element {
  const { mobileOpen, setMobileOpen, toggleMobileOpen, searchQuery, setSearchQuery, activeRegion, setActiveRegion, selectedId, sidebarHoveredId, setSidebarHoveredId, locale } = useMapStore();
  const tr = t(locale);
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const { regions } = useAtlasData();
  const filtered = useFilteredAnimals();
  const { canInstall, promptInstall } = useInstallPrompt();

  const flyTo = (c: AnimalEntry) => {
    useMapStore.getState().setSelectedId(c.id);
    useMapStore.getState().setFocusTarget({ lng: c.lng, lat: c.lat });
    setMobileOpen(false);
  };

  const onDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 120 || info.velocity.y > 400) setMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={toggleMobileOpen}
        className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
        aria-label={mobileOpen ? tr.close : "Open species list"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <AnimatePresence>
          {mobileOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-30 bg-black/30 md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-label={tr.search}>
                <motion.aside
                  className="fixed inset-x-0 bottom-0 z-30 flex max-h-[60vh] flex-col gap-3 rounded-t-2xl border-t border-border bg-card p-4 outline-none md:hidden"
                  initial={reduceMotion ? { y: 0, opacity: 0 } : { y: '100%' }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
                  transition={SHEET_SPRING}
                  drag={reduceMotion ? false : 'y'}
                  dragListener={false}
                  dragControls={dragControls}
                  dragConstraints={{ top: 0 }}
                  dragElastic={{ top: 0.05, bottom: 0.6 }}
                  onDragEnd={onDragEnd}
                >
                  <Dialog.Title className="sr-only">{tr.search}</Dialog.Title>

                  {/* Grabber row — drag down to dismiss */}
                  <div
                    className="flex cursor-grab items-center justify-between touch-none active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    onPointerDown={(e) => dragControls.start(e)}
                  >
                    <div className="w-10 h-1 rounded-full bg-border" />
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold bg-accent hover:bg-accent/80 active:bg-accent/60 text-foreground transition-colors"
                    >{tr.done}</button>
                  </div>

                  {/* Quiz entry — the mobile header is too full for it */}
                  <Link
                    href="/quiz"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-accent/50 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <Gamepad2 size={16} aria-hidden className="text-primary" />
                    {tr.quiz.title}
                  </Link>

                  {/* PWA install — only when the browser fired beforeinstallprompt */}
                  {canInstall && (
                    <button
                      onClick={promptInstall}
                      className="flex items-center gap-2 rounded-xl border border-border bg-accent/50 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                    >
                      <Download size={16} aria-hidden className="text-primary" />
                      {tr.install.title}
                    </button>
                  )}

                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={tr.search}
                      aria-label={tr.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-border bg-accent/50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card transition-colors duration-150"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...regions].map((c) => (
                      <button
                        key={c}
                        onClick={() => setActiveRegion(c)}
                        aria-pressed={activeRegion === c}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                          activeRegion === c
                            ? "region-pill-active"
                            : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                        }`}
                      >
                        {tr.regions[c as keyof typeof tr.regions] ?? c}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin">
                    {filtered.map((c, i) => {
                      const isSelected = selectedId === c.id;
                      const isHovered = sidebarHoveredId === c.id;
                      const color = CONTINENT_COLORS[c.region] || "#6366f1";
                      return (
                        <button
                          key={c.id}
                          onClick={() => flyTo(c)}
                          onMouseEnter={() => {
                            setSidebarHoveredId(c.id);
                            audioService.playHoverSound();
                          }}
                          onMouseLeave={() => setSidebarHoveredId(null)}
                          className={`sidebar-item country-item-animate flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${
                            isSelected
                              ? "bg-primary/8 ring-1 ring-primary/20"
                              : isHovered
                              ? "bg-accent/60"
                              : ""
                          }`}
                          style={{
                            animationDelay: `${Math.min(i * 30, 300)}ms`,
                            borderLeft: isSelected
                              ? `3px solid var(--natura-emerald)`
                              : `2px solid ${color}40`,
                          }}
                        >
                          <span className="text-base">{c.flag}</span>
                          <div className="flex-1 min-w-0">
                            <span className="block truncate text-foreground">{c.country}</span>
                            <span className="block text-xs text-muted-foreground truncate">{c.animal}</span>
                          </div>
                          <span className="text-base">{c.emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.aside>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
