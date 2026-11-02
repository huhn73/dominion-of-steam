import type { ReactNode, SVGProps } from 'react'
import type { UnitDomain } from '../types'

// Dieselpunk unit icons on a 24×24 grid. Strokes use the current color,
// small filled details (rivets, portholes, smoke) give them their industrial character.
// Identical copy in src/sections/fraktionen-and-einheiten/components/unitIcons.tsx – keep both in sync.

const dot = (cx: number, cy: number, r = 0.9) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />

const ICONS: Record<string, ReactNode> = {
  // Gas-masked infantry helmet with filter canister
  grenadiere: (
    <>
      <path d="M5 11a7 7 0 0 1 14 0" />
      <path d="M3.5 11h17" />
      <path d="M12 4V2.5" />
      <path d="M7 11v2.5a5 5 0 0 0 10 0V11" />
      <circle cx="9.6" cy="13.2" r="1.5" />
      <circle cx="14.4" cy="13.2" r="1.5" />
      <path d="M10.5 18h3v3.5h-3z" />
      {dot(12, 19.8, 0.6)}
    </>
  ),
  // Armoured steam car with turret, chimney and three wheels
  panzerwagen: (
    <>
      <path d="M2.5 16v-4l3-3h9l3 3h3v4z" />
      <path d="M8.5 9V6.5h4.5V9" />
      <path d="M13 7.5h7.5" />
      <path d="M5 9V5" />
      {dot(5, 3.4, 1.1)}
      {dot(7.2, 2.6, 0.7)}
      <circle cx="6" cy="17.8" r="2" />
      <circle cx="12" cy="17.8" r="2" />
      <circle cx="18" cy="17.8" r="2" />
      {dot(9, 13.5)}
      {dot(15, 13.5)}
    </>
  ),
  // Tracked fortress with bridge, twin chimneys and riveted hull
  dampfkoloss: (
    <>
      <path d="M4 16.5h16a2.5 2.5 0 0 1 0 5H4a2.5 2.5 0 0 1 0-5z" />
      <path d="M5 16.5V10h14v6.5" />
      <path d="M8 10V7h6v3" />
      <path d="M15.5 7V3.5" />
      <path d="M17.5 10V5" />
      <path d="M5 12.5H1.5" />
      {dot(8, 13.3)}
      {dot(12, 13.3)}
      {dot(16, 13.3)}
      {dot(6, 19)}
      {dot(10, 19)}
      {dot(14, 19)}
      {dot(18, 19)}
      {dot(15.5, 2.2, 1)}
    </>
  ),
  // Small gunboat with mast, chimney and bow gun
  kanonenboot: (
    <>
      <path d="M2 14.5h20l-3 4.5H5z" />
      <path d="M8 14.5v-3h6v3" />
      <path d="M11 11.5V8" />
      {dot(11, 6.4, 1.1)}
      <path d="M5.5 14.5V7l3 2" />
      <path d="M15.5 13l4-2.2" />
      <path d="M2 21.5c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1" />
    </>
  ),
  // Heavy cruiser: layered superstructure, two stacks, turrets fore and aft
  panzerkreuzer: (
    <>
      <path d="M1.5 14h21l-2.5 5H4z" />
      <path d="M6 14v-3h11v3" />
      <path d="M8.5 11V8h5.5v3" />
      <path d="M10 8V4.5" />
      <path d="M12.8 8V5.5" />
      {dot(10, 3.2, 1)}
      <path d="M3.5 14v-1.5h2" />
      <path d="M17.5 12.5h4" />
      {dot(7, 16.5, 0.7)}
      {dot(11, 16.5, 0.7)}
      {dot(15, 16.5, 0.7)}
    </>
  ),
  // Submarine with conning tower, periscope and portholes
  tauchboot: (
    <>
      <path d="M3 13.5a4 4 0 0 1 4-4h10a4 4 0 0 1 0 8H7a4 4 0 0 1-4-4z" />
      <path d="M9.5 9.5V6.5h4v3" />
      <path d="M12 6.5V3.5h2.5" />
      <path d="M21 13.5h1.8M22.8 11.8v3.4" />
      <circle cx="8" cy="13.5" r="1" />
      <circle cx="12" cy="13.5" r="1" />
      <circle cx="16" cy="13.5" r="1" />
      <path d="M1 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1" />
    </>
  ),
  // Cargo steamer with crates and a crane
  frachter: (
    <>
      <path d="M2 14.5h20l-2.5 4.5h-15z" />
      <path d="M4.5 14.5v-3h4v3" />
      <path d="M9.5 14.5v-4.5h4.5v4.5" />
      <path d="M9.5 12.2h4.5M6.5 11.5v3" />
      <path d="M17.5 14.5V5.5l-3.5 2.5" />
      <path d="M14 8v2" />
      <path d="M20 14.5v-3" />
      {dot(20, 10, 0.9)}
    </>
  ),
  // Fast corvette with a raked hull and a lightning bolt
  blitzkorvette: (
    <>
      <path d="M1.5 15.5h17l4-2.5-2 5.5H4z" />
      <path d="M6 15.5v-2.5h5l1.5 2.5" />
      <path d="M8 13V10.5" />
      {dot(8, 9.2, 1)}
      <path d="M15.5 2.5l-3.5 6h3l-2.5 5.5 6-7.5h-3.2l2.4-4z" />
    </>
  ),
  // Biplane, front view: double wings, struts, radial engine
  doppeldecker: (
    <>
      <path d="M2 8h20" />
      <path d="M3.5 14.5h17" />
      <path d="M6 8v6.5M18 8v6.5" />
      <path d="M6 8l3 6.5M18 8l-3 6.5" />
      <circle cx="12" cy="11.3" r="2.6" />
      {dot(12, 11.3, 0.9)}
      <path d="M12 6.2v10.2" />
      <path d="M10.5 14.5l-1.2 3.8M13.5 14.5l1.2 3.8" />
      <circle cx="9" cy="19.5" r="1.2" />
      <circle cx="15" cy="19.5" r="1.2" />
    </>
  ),
  // Heavy bomber, top view: wide wing, four engines, tail plane
  schwerbomber: (
    <>
      <path d="M12 3.5v16" />
      <path d="M10.5 5.5a1.5 1.5 0 0 1 3 0" />
      <path d="M1.5 10.5h21l-1 2h-19z" />
      <path d="M8.5 18.5h7" />
      <circle cx="4.8" cy="11.5" r="1.2" />
      <circle cx="8.4" cy="11.5" r="1.2" />
      <circle cx="15.6" cy="11.5" r="1.2" />
      <circle cx="19.2" cy="11.5" r="1.2" />
      {dot(10.5, 15, 0.7)}
      {dot(13.5, 15, 0.7)}
    </>
  ),
  // Aircraft carrier: flat deck, island with funnel, plane on deck
  flugzeugtraeger: (
    <>
      <path d="M2.5 14.5h19l-2 4h-15z" />
      <path d="M1 12.5h22v2H1z" />
      <path d="M16 12.5V8.5h3v4" />
      <path d="M17.5 8.5V5.5" />
      {dot(17.5, 4.2, 1)}
      <path d="M5 11h5M7.5 9.5v3" />
      <path d="M1 21.5c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1" />
    </>
  ),
  // Zeppelin with ribbed envelope, fins and gondola
  wolkenkreuzer: (
    <>
      <ellipse cx="11.5" cy="9" rx="9" ry="4.6" />
      <path d="M6.5 4.9v8.2M11.5 4.4v9.2M16.5 4.9v8.2" />
      <path d="M20 6.8l2.5-2v8.4l-2.5-2" />
      <path d="M9 13.4l-.5 3M14 13.4l.5 3" />
      <path d="M8 16.4h7l-1 2.6H9z" />
      {dot(10, 17.6, 0.6)}
      {dot(13, 17.6, 0.6)}
    </>
  ),
}

const FALLBACK: Record<UnitDomain, string> = { land: 'grenadiere', sea: 'kanonenboot', air: 'doppeldecker' }

type UnitIconProps = Omit<SVGProps<SVGSVGElement>, 'color'> & {
  unitTypeId: string
  domain?: UnitDomain
  color?: string
}

/** Renders the dieselpunk icon for a unit type */
export function UnitIcon({ unitTypeId, domain = 'land', color, strokeWidth = 1.7, ...props }: UnitIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={color ? { color } : undefined}
      {...props}
    >
      {ICONS[unitTypeId] ?? ICONS[FALLBACK[domain]]}
    </svg>
  )
}
