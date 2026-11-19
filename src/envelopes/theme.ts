export interface EnvelopeTheme {
  id: string;
  name: string;
  paper: string; // outside colour
  liner: string; // inside colour
  texture: "paper" | "linen" | "none";
  seal: { kind: "wax" | "sticker"; color: string; emblem: string };
}

export const ENVELOPE_THEMES: readonly EnvelopeTheme[] = [
  {
    id: "ivory",
    name: "Ivory & burgundy wax",
    paper: "#f3ead8",
    liner: "#c9a85c",
    texture: "paper",
    seal: { kind: "wax", color: "#8c1c2b", emblem: "♥" },
  },
  {
    id: "kraft",
    name: "Kraft & party sticker",
    paper: "#c49a6c",
    liner: "#f2e3c6",
    texture: "linen",
    seal: { kind: "sticker", color: "#ff5a5f", emblem: "🎉" },
  },
  {
    id: "midnight",
    name: "Midnight & silver wax",
    paper: "#1f2a44",
    liner: "#0f1626",
    texture: "paper",
    seal: { kind: "wax", color: "#b8c0d0", emblem: "★" },
  },
  {
    id: "blush",
    name: "Blush & rose wax",
    paper: "#f7d6dc",
    liner: "#fff1f3",
    texture: "paper",
    seal: { kind: "wax", color: "#d6336c", emblem: "♥" },
  },
];

export const FALLBACK_ENVELOPE = ENVELOPE_THEMES[0];

export function getEnvelopeTheme(id: string): EnvelopeTheme {
  return ENVELOPE_THEMES.find((t) => t.id === id) ?? FALLBACK_ENVELOPE;
}