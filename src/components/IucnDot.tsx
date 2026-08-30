import React from "react";
import { IUCN_FALLBACK } from "../lib/iucn";

/** One shape per IUCN status so conservation status isn't encoded by color
 *  alone. Palette comes from IUCN_CONFIG / IUCN_FALLBACK (iucn.ts). */
function statusShape(code: string, color: string): React.JSX.Element {
  switch (code) {
    case "LC":
      return <circle cx="6" cy="6" r="4" fill={color} />;
    case "NT":
      return <circle cx="6" cy="6" r="3.1" fill="none" stroke={color} strokeWidth="1.8" />;
    case "VU":
      return <rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1" fill={color} />;
    case "EN":
      return <path d="M6 1.8 L10.4 10.2 L1.6 10.2 Z" fill={color} />;
    case "CR":
      return <path d="M6 1.5 L10.5 6 L6 10.5 L1.5 6 Z" fill={color} />;
    case "EX":
      return (
        <path
          d="M2.8 2.8 L9.2 9.2 M9.2 2.8 L2.8 9.2"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      );
    case "DD":
      return (
        <g>
          <circle cx="6" cy="6" r="4" fill="none" stroke={color} strokeWidth="1.3" strokeDasharray="2 1.6" />
          <path d="M6 2 a4 4 0 0 1 0 8 Z" fill={color} />
        </g>
      );
    default: // NE and unknown codes
      return <circle cx="6" cy="6" r="3.4" fill="none" stroke={color} strokeWidth="1.4" strokeDasharray="2.4 1.8" />;
  }
}

interface IucnDotProps {
  code: string;
  color?: string;
  size?: number;
  className?: string;
}

/** Small SVG marker for an IUCN status code — same footprint as the old
 *  colored dots, plus a unique glyph per status. */
export default function IucnDot({ code, color, size = 12, className }: IucnDotProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden="true"
    >
      {statusShape(code, color ?? IUCN_FALLBACK)}
    </svg>
  );
}
