"use client"
import React from 'react';

import { useMemo } from 'react';
import { getPopulationTrend, TREND_COLORS, TREND_LABELS, TREND_ICONS, type TrendDirection } from '../data/populationTrends';

interface PopulationChartProps {
  slug: string;
  conservationStatus: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
}

/** Pure SVG sparkline showing population trend */
export default function PopulationChart({
  slug,
  conservationStatus,
  width = 200,
  height = 60,
}: PopulationChartProps): React.JSX.Element {
  const trend = useMemo(() => getPopulationTrend(slug, conservationStatus), [slug, conservationStatus]);
  const color = TREND_COLORS[trend.direction];
  const label = TREND_LABELS[trend.direction];
  const icon = TREND_ICONS[trend.direction];

  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2 - 16; // leave room for label

  // Build SVG path
  const points = trend.dataPoints;
  const maxVal = Math.max(...points, 1);
  const minVal = Math.min(...points, 0);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, i) => ({
    x: padding + (i / (points.length - 1)) * chartW,
    y: padding + chartH - ((val - minVal) / range) * chartH,
  }));

  // Line path
  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Area path (filled below line)
  const areaPath = `${linePath} L ${(padding + chartW).toFixed(1)} ${(padding + chartH).toFixed(1)} L ${padding.toFixed(1)} ${(padding + chartH).toFixed(1)} Z`;

  return (
    <div className="glass-card rounded-xl p-3 group hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Population Trend
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs">{icon}</span>
          <span className="text-[10px] font-bold" style={{ color }}>
            {label}
          </span>
        </div>
      </div>
      <svg
        width={width}
        height={height - 16}
        viewBox={`0 0 ${width} ${height - 16}`}
        className="w-full"
        style={{ maxWidth: width }}
        role="img"
        aria-label={`Population trend: ${label}`}
      >
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`trend-grad-${slug}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#trend-grad-${slug})`}
          className="transition-all duration-700"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: 0,
            animation: 'trend-draw 1.2s ease-out forwards',
          }}
        />

        {/* End dot */}
        {coords.length > 0 && (
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r="3"
            fill={color}
            className="transition-all duration-700"
          >
            <animate
              attributeName="opacity"
              values="0;1"
              dur="0.5s"
              begin="0.8s"
              fill="freeze"
            />
          </circle>
        )}
      </svg>
    </div>
  );
}
