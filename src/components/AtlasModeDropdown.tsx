'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bone, Check, ChevronDown, Leaf, type LucideIcon } from 'lucide-react';

import { t } from '../lib/i18n';
import { useMapStore, type AtlasMode } from '../store/useMapStore';

interface AtlasModeDropdownProps {
  /** Currently visible record count, shown in the trigger subtitle */
  count: number;
  /** Currently visible region count, shown in the trigger subtitle */
  regionCount: number;
}

const MODE_OPTIONS: Array<{ value: AtlasMode; Icon: LucideIcon }> = [
  { value: 'wildlife', Icon: Leaf },
  { value: 'prehistoric', Icon: Bone },
];

/** Header brand block doubling as the Wildlife / Era Purba mode switcher */
export default function AtlasModeDropdown({
  count,
  regionCount,
}: AtlasModeDropdownProps): React.JSX.Element {
  const { atlasMode, setAtlasMode, locale } = useMapStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isPrehistoric = atlasMode === 'prehistoric';
  const strings = t(locale);
  const TileIcon = isPrehistoric ? Bone : Leaf;
  const heading = isPrehistoric ? 'Era Purba Atlas' : strings.title;

  const selectMode = useCallback(
    (mode: AtlasMode) => {
      if (mode !== atlasMode) setAtlasMode(mode);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [atlasMode, setAtlasMode],
  );

  // Close when a press lands anywhere outside the widget
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  // Land keyboard users on the active option
  useEffect(() => {
    if (open) optionRefs.current[Math.max(MODE_OPTIONS.findIndex((o) => o.value === atlasMode), 0)]?.focus();
  }, [open, atlasMode]);

  const moveFocus = (direction: 1 | -1) => {
    const current = Math.max(MODE_OPTIONS.findIndex((o) => o.value === atlasMode), 0);
    const next = (current + direction + MODE_OPTIONS.length) % MODE_OPTIONS.length;
    optionRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(-1);
    }
  };

  const chevronClass = `text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`;

  return (
    <div ref={rootRef} className="relative flex items-center gap-2" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={heading}
        className={`press flex items-center gap-2 rounded-lg border px-2 py-1 text-left transition-colors duration-200 ${
          open
            ? 'border-primary/40 bg-accent/60 shadow-sm'
            : 'border-border bg-accent/30 hover:border-primary/30 hover:bg-accent/60'
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
            isPrehistoric ? 'bg-gradient-to-br from-amber-600 to-orange-500' : 'bg-natura-gradient'
          }`}
        >
          <TileIcon size={16} className="drop-shadow-sm" />
        </div>
        <div className="hidden flex-col sm:flex">
          <span className="flex items-center gap-1 text-sm font-semibold font-[var(--font-heading)] leading-tight text-foreground">
            {heading}
            <ChevronDown size={13} className={chevronClass} />
          </span>
          <span className="text-[10px] leading-tight text-muted-foreground">
            {count} {isPrehistoric ? strings.dinosaurUnit : strings.countries} · {regionCount} Regions
          </span>
        </div>
        <span className="flex items-center sm:hidden">
          <ChevronDown size={12} className={chevronClass} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={strings.atlasModes[atlasMode]}
          className="animate-fade-in-scale absolute left-0 top-full z-50 mt-2 w-56 origin-top-left overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl"
        >
          {MODE_OPTIONS.map((option, index) => {
            const selected = option.value === atlasMode;
            const OptionIcon = option.Icon;
            return (
              <button
                key={option.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectMode(option.value)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60 focus:bg-accent/60'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white ${
                    option.value === 'prehistoric' ? 'bg-gradient-to-br from-amber-600 to-orange-500' : 'bg-natura-gradient'
                  }`}
                >
                  <OptionIcon size={13} />
                </span>
                <span className="font-medium">{strings.atlasModes[option.value]}</span>
                {selected && <Check size={14} className="ml-auto shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
