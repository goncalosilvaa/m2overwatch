import * as React from "react";

export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="m2grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb169" />
          <stop offset="0.55" stopColor="#ff8a2e" />
          <stop offset="1" stopColor="#ff6a00" />
        </linearGradient>
        <linearGradient id="m2gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* tile */}
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="9" fill="url(#m2grad)" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="9" fill="url(#m2gloss)" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="9" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
      {/* shield */}
      <path
        d="M16 6.2 L23.6 9 V15 C23.6 19.8 20.2 22.9 16 24.6 C11.8 22.9 8.4 19.8 8.4 15 V9 Z"
        fill="#ffffff"
        fillOpacity="0.16"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* check */}
      <path
        d="M12.5 15.7 L15.1 18.3 L19.7 13"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ sub, size = 28 }: { sub?: string; size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} className="drop-shadow-[0_4px_12px_rgba(255,122,24,0.35)]" />
      <span className="font-extrabold tracking-tight text-[17px] leading-none">
        M2
        <span className="bg-gradient-to-r from-[#ffb169] to-[#ff7a18] bg-clip-text text-transparent">Overwatch</span>
      </span>
      {sub && <span className="text-muted font-normal text-sm">· {sub}</span>}
    </span>
  );
}
