export type PatternKind = "none" | "dots" | "stripes" | "diamonds" | "image";
export interface SurfacePattern {
  kind: PatternKind;
  color: string; 
  opacity: number; 
  tiles: number; 
  src?: string; 
}

export interface EnvelopeTheme {
  id: string;
  name: string;
  paper: string;
  paperPattern: SurfacePattern;
  liner: string;
  linerPattern: SurfacePattern;
  flap: "pointed" | "rounded";
  seal: { color: string; emblem: string };
}

const none : SurfacePattern = { kind : "none" , color : "#000000" , opacity : 0 , tiles: 1};


export const ENVELOPE_THEMES: readonly EnvelopeTheme[] = [
  {
    id: "ivory",
    name: "Ivory & burgundy wax",
    paper: "#f3ead8",
    paperPattern: { kind: "diamonds", color: "#c9a85c", opacity: 0.35, tiles: 10 },
    liner: "#c9a85c",
    linerPattern: { kind: "dots", color: "#f3ead8", opacity: 0.25, tiles: 14 },
    flap: "pointed",
    seal: { color: "#8c1c2b", emblem: "♥" },
  },
  {
    id: "kraft",
    name: "Kraft & party sticker",
    paper: "#c49a6c",
    paperPattern: { kind: "stripes", color: "#8a6a44", opacity: 0.18, tiles: 24 },
    liner: "#f2e3c6",
    linerPattern: { kind: "dots", color: "#ff5a5f", opacity: 0.35, tiles: 16 },
    flap: "rounded",
    seal: { color: "#ff5a5f", emblem: "🎉" },
  },
  {
    id: "midnight",
    name: "Midnight & silver wax",
    paper: "#1f2a44",
    paperPattern: { kind: "dots", color: "#b8c0d0", opacity: 0.25, tiles: 18 },
    liner: "#0f1626",
    linerPattern: none,
    flap: "pointed",
    seal: { color: "#b8c0d0", emblem: "★" },
  },
  {
    id: "blush",
    name: "Blush & rose wax",
    paper: "#f7d6dc",
    paperPattern: { kind: "diamonds", color: "#d6336c", opacity: 0.2, tiles: 12 },
    liner: "#fff1f3",
    linerPattern: { kind: "dots", color: "#d6336c", opacity: 0.2, tiles: 16 },
    flap: "rounded",
    seal: { color: "#d6336c", emblem: "♥" },
  },
];

export const FALLBACK_ENVELOPE = ENVELOPE_THEMES[0];

export function getEnvelopeTheme(id: string): EnvelopeTheme {
  return ENVELOPE_THEMES.find((t) => t.id === id) ?? FALLBACK_ENVELOPE;
}