"use client"
import React from 'react';

import { t } from '../lib/i18n';
import { useMapStore } from '../store/useMapStore';

/** Mesozoic periods, oldest → youngest (Ma = million years ago). */
const PERIODS = [
  { name: { id: 'Trias', en: 'Triassic' }, from: 252, to: 201, color: '#7c9a5e' },
  { name: { id: 'Jura', en: 'Jurassic' }, from: 201, to: 145, color: '#5e8ea8' },
  { name: { id: 'Kapur', en: 'Cretaceous' }, from: 145, to: 66, color: '#b08d57' },
] as const

const SCALE_FROM = 252
const SCALE_TO = 66

const maToX = (ma: number, width: number, pad: number) =>
  pad + ((SCALE_FROM - ma) / (SCALE_FROM - SCALE_TO)) * (width - pad * 2)

interface GeologicTimeBarProps {
  /** PBDB fossil info of the taxon (interval + Ma range). */
  fossil: { interval: string; earlyAgeMa: number; lateAgeMa: number }
  width?: number
}

/**
 * Horizontal geologic timeline: Mesozoic period bands with the taxon's
 * age-range bar placed on the scale. Pure SVG, no chart library.
 */
export default function GeologicTimeBar({ fossil, width = 320 }: GeologicTimeBarProps): React.JSX.Element {
  const locale = useMapStore((s) => s.locale)
  const tr = t(locale)
  const height = 74
  const pad = 8
  const bandH = 14
  const barY = 38

  const x1 = maToX(fossil.earlyAgeMa, width, pad)
  const x2 = maToX(fossil.lateAgeMa, width, pad)
  const barW = Math.max(x2 - x1, 4)
  const midX = (x1 + x2) / 2

  return (
    <div className="glass-card rounded-xl p-3" style={{ maxWidth: width }}>
      <div className="mb-1 text-micro font-semibold uppercase tracking-wider text-muted-foreground">
        {t(locale).geoTime}
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${fossil.interval}: ${fossil.earlyAgeMa}–${fossil.lateAgeMa} Ma`}>
        {/* Period bands */}
        {PERIODS.map((p) => {
          const bx = maToX(p.from, width, pad)
          const bw = maToX(p.to, width, pad) - bx
          return (
            <g key={p.name.en}>
              <rect x={bx} y={8} width={bw} height={bandH} rx={3} fill={p.color} opacity={0.28} />
              <text x={bx + bw / 2} y={19} textAnchor="middle" fontSize={8.5} fill="var(--foreground)" opacity={0.75}>
                {locale === 'id' ? p.name.id : p.name.en}
              </text>
            </g>
          )
        })}

        {/* Taxon range bar */}
        <rect x={x1} y={barY} width={barW} height={10} rx={5} fill="var(--natura-emerald)" opacity={0.9} />
        <line x1={midX} y1={barY - 4} x2={midX} y2={barY} stroke="var(--natura-emerald)" strokeWidth={1.5} />
        <text x={midX} y={barY + 22} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--foreground)">
          {fossil.earlyAgeMa}–{fossil.lateAgeMa} Ma
        </text>
      </svg>
    </div>
  )
}
