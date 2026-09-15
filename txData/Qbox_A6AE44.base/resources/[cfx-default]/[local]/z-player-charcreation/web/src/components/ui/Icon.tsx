"use client";

import { JSX } from "react";

/**
 * Tiny hand-rolled stroke icon set.
 *
 * Deliberately not an icon package: this bundle is loaded off disk by the game's CEF
 * browser, so every extra dependency is weight we ship for no reason, and inline paths
 * can never turn into a runtime network request the way a hosted icon font would.
 *
 * All icons are drawn on a 24x24 grid, stroke-only, and inherit `currentColor`.
 */

const PATHS: Record<string, JSX.Element> = {
  // --- identity / navigation -------------------------------------------------
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c.7-4 3.8-6 7.5-6s6.8 2 7.5 6" />
    </>
  ),
  idCard: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <circle cx="8.5" cy="11" r="2.1" />
      <path d="M5 16.4c.5-1.7 1.9-2.6 3.5-2.6s3 .9 3.5 2.6M14.5 10h4.5M14.5 13.5h3" />
    </>
  ),
  head: (
    <>
      <path d="M12 3c3.6 0 6 2.7 6 6.2 0 2.3-.7 3.3-.7 4.6 0 .8.9 1 .9 1.7 0 .6-.6.9-1.4.9h-.9v1.4c0 1.4-.9 2.2-2.4 2.2h-2" />
      <path d="M12 3C8.4 3 6 5.7 6 9.2c0 2.6 1 3.7 1 5.3" />
      <path d="M9.8 9.6h.01M14.4 9.6h.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="17" r="2" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6.5" r="2.5" />
      <circle cx="6" cy="17.5" r="2.5" />
      <path d="M8.2 7.9 20 18M8.2 16.1 20 6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  ink: (
    <>
      <path d="M14.5 3.5 20.5 9.5 9.8 20.2a3 3 0 0 1-1.5.8L4 22l1-4.3a3 3 0 0 1 .8-1.5z" />
      <path d="M12.6 5.4 18.6 11.4" />
    </>
  ),

  // --- face-feature groups ---------------------------------------------------
  nose: (
    <>
      <path d="M12 4v7.5c0 1.2-1.6 1.8-1.6 3.1 0 1.3 1.1 2.1 2.6 2.1 1.4 0 2.4-.6 2.9-1.6" />
      <path d="M8.6 17.9c.9.8 2.1 1.3 3.4 1.3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  cheek: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7.5 9.5h.01M16.5 9.5h.01" />
      <path d="M6.5 13.5c1.2 1.4 2.6 2.1 4 2.1M17.5 13.5c-1.2 1.4-2.6 2.1-4 2.1" />
    </>
  ),
  jaw: (
    <>
      <path d="M5 4v6.5c0 4.2 3.1 7.5 7 7.5s7-3.3 7-7.5V4" />
      <path d="M9 20.5h6" />
    </>
  ),
  mouth: (
    <>
      <path d="M3.5 12c2.5-2.5 5.3-3.7 8.5-3.7s6 1.2 8.5 3.7" />
      <path d="M3.5 12c2.5 2.7 5.3 4 8.5 4s6-1.3 8.5-4" />
      <path d="M3.5 12h17" />
    </>
  ),
  dna: (
    <>
      <path d="M7 3c0 5 10 5 10 9s-10 4-10 9" />
      <path d="M17 3c0 5-10 5-10 9s10 4 10 9" />
      <path d="M8.5 7.5h7M8.5 16.5h7" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 3.5s6 6 6 9.7A6 6 0 0 1 6 13.2C6 9.5 12 3.5 12 3.5Z" />
      <path d="M9.4 13.7a2.7 2.7 0 0 0 2.6 2.7" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
      <path d="M12 6.5a5.5 5.5 0 0 1 0 11" fill="currentColor" stroke="none" />
    </>
  ),

  // --- actions ---------------------------------------------------------------
  play: <path d="M8 5.2 19 12 8 18.8z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.9 12.2A1.8 1.8 0 0 0 9.2 21h5.6a1.8 1.8 0 0 0 1.8-1.8L17.5 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.4 15.4 4.6 4.6" />
    </>
  ),
  power: (
    <>
      <path d="M12 3.5v8" />
      <path d="M17.5 6.6a7.5 7.5 0 1 1-11 0" />
    </>
  ),
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2h.01" />
    </>
  ),

  // --- camera hints ----------------------------------------------------------
  mouse: (
    <>
      <rect x="7.5" y="3" width="9" height="18" rx="4.5" />
      <path d="M12 7v3" />
    </>
  ),
  rotate: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.5 3.5V9h-5.5" />
    </>
  ),
  zoom: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.4 15.4 4.6 4.6M8 10.5h5M10.5 8v5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 16, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      {PATHS[name]}
    </svg>
  );
}
