export type MotionKind = "none" | "drift" | "float" | "rotate" | "sway" | "pulse";

export interface Motion {
  kind: MotionKind;
  amount: number; // drift/float: % of card width; sway: degrees; pulse: % scale
  duration: number; // seconds
  delay: number; // seconds
}

export interface CardLayer {
  id: string;
  src: string;
  x: number; // centre, % of card width
  y: number; // centre, % of card height
  w: number; // width, % of card width
  rotate: number; // degrees
  z: number;
  motion: Motion;
  parallax: number; // 0 = none, higher = moves more with the pointer
}

export type SlotKey = "greeting" | "title" | "date" | "location" | "note" | "host";
export type SlotFont = "serif" | "script" | "sans";

export interface CardSlot {
  key: SlotKey;
  x: number;
  y: number;
  w: number;
  size: number; // font size, % of card width
  align: "left" | "center" | "right";
  font: SlotFont;
  color: string;
  weight: 400 | 600 | 700;
  upper: boolean;
  z: number;
}

export interface CardSource {
  author: string;
  url: string;
  licence: string;
  changes: string;
}

export interface CardSpec {
  v: 1;
  id: string;
  name: string;
  genre: string;
  aspect: number; // width / height
  bg: { color: string; src?: string };
  layers: CardLayer[];
  slots: CardSlot[];
  source: CardSource[];
}

export interface CardTexts {
  guest?: string;
  title: string;
  date: string;
  location?: string;
  note?: string;
  host?: string;
}

export const SLOT_KEYS: SlotKey[] = ["greeting", "title", "date", "location", "note", "host"];

export const NO_MOTION: Motion = { kind: "none", amount: 2, duration: 6, delay: 0 };

export const ASPECTS: { label: string; value: number }[] = [
  { label: "4:5 (slightly vertical)", value: 0.8 },
  { label: "3:4", value: 0.75 },
  { label: "2:3", value: 0.6667 },
  { label: "9:16 (tall)", value: 0.5625 },
  { label: "1:1", value: 1 },
];

export function slotText(key: SlotKey, t: CardTexts): string {
  switch (key) {
    case "greeting":
      return t.guest ? `${t.guest}, you’re invited` : "You’re invited";
    case "title":
      return t.title;
    case "date":
      return t.date;
    case "location":
      return t.location ?? "";
    case "note":
      return t.note ?? "";
    case "host":
      return t.host ? `Hosted by ${t.host}` : "";
  }
}

export function defaultSlots(): CardSlot[] {
  const base = { align: "center" as const, color: "#3a2a1a", weight: 400 as const, upper: false, z: 100 };
  return [
    { ...base, key: "greeting", x: 50, y: 12, w: 80, size: 4.4, font: "serif" },
    { ...base, key: "title", x: 50, y: 28, w: 84, size: 9, font: "serif", weight: 700 },
    { ...base, key: "date", x: 50, y: 62, w: 80, size: 4.6, font: "serif" },
    { ...base, key: "location", x: 50, y: 69, w: 80, size: 4.2, font: "serif" },
    { ...base, key: "note", x: 50, y: 79, w: 72, size: 3.8, font: "serif" },
    { ...base, key: "host", x: 50, y: 91, w: 70, size: 3.6, font: "serif" },
  ];
}

export function nextLayerId(layers: CardLayer[]): string {
  let max = 0;
  for (const l of layers) {
    const m = /^l(\d+)$/.exec(l.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `l${max + 1}`;
}

export function buildDefaultSpec(templateId: string, files: string[]): CardSpec {
  const bgFile = files.find((f) => /^bg/i.test(f));
  const rest = files.filter((f) => f !== bgFile);
  return {
    v: 1,
    id: templateId,
    name: templateId,
    genre: templateId.replace(/-\d+$/, ""),
    aspect: 0.8,
    bg: { color: "#f4ecdc", src: bgFile ? `/cards/${templateId}/${bgFile}` : undefined },
    layers: rest.map((f, i) => ({
      id: `l${i + 1}`,
      src: `/cards/${templateId}/${f}`,
      x: 20 + ((i * 17) % 60),
      y: 20 + ((i * 23) % 60),
      w: 28,
      rotate: 0,
      z: i + 1,
      motion: { ...NO_MOTION },
      parallax: 0,
    })),
    slots: defaultSlots(),
    source: [{ author: "", url: "", licence: "", changes: "" }],
  };
}

export function mergeFiles(spec: CardSpec, files: string[]): CardSpec {
  const used = new Set<string>([spec.bg.src ?? "", ...spec.layers.map((l) => l.src)]);
  const fresh = files.map((f) => `/cards/${spec.id}/${f}`).filter((src) => !used.has(src));
  if (fresh.length === 0) return spec;
  const layers = [...spec.layers];
  for (const src of fresh) {
    const n = layers.length + 1;
    layers.push({
      id: nextLayerId(layers),
      src,
      x: 20 + ((n * 17) % 60),
      y: 20 + ((n * 23) % 60),
      w: 28,
      rotate: 0,
      z: n,
      motion: { ...NO_MOTION },
      parallax: 0,
    });
  }
  return { ...spec, layers };
}


export function specUrls(spec : CardSpec) : string[] {
  const list = [spec.bg.src , ...spec.layers.map((l) => l.src)].filter((u): u is string => !!u);
  return  Array.from(new Set(list));
}