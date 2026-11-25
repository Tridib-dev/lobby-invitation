
import type { flapShapeId } from "./flapShapes"
import { FLAP_SHAPES } from "./flapShapes";


export type PatternKind = "none" | "dots" | "stripes" | "diamonds" | "image";
export interface SurfacePattern {
  kind: PatternKind;
  color: string; 
  opacity: number; 
  tiles: number; 
  src?: string; 
  blend?: GlobalCompositeOperation;
  raised?: boolean;
}

export interface EnvelopeTheme {
  id: string;
  name: string;
  paper: string;
  paperPattern: SurfacePattern;
  flapPaper?: string;
  flapPattern?:SurfacePattern;
  flapMotif?: flapMotif;
  liner: string;
  linerPattern: SurfacePattern;
  flap: flapShapeId;
  seal: { color: string; emblem: string; finish?: "wax" | "metal" };
}


export interface flapMotif {
  src : string;
  height : number;
  y : number;
  opacity : number;
  tint?: string;
  blend?: GlobalCompositeOperation;
  raised?: boolean; 
}
const none : SurfacePattern = { kind : "none" , color : "#000000" , opacity : 0 , tiles: 1};


export const ENVELOPE_THEMES: readonly EnvelopeTheme[] = [
  {
    id: "ivory",
    name: "Ivory & burgundy wax",
    paper: "#f3ead8",
    paperPattern: { kind: "image", src: "/patterns/petal-cross.svg", tiles: 6, opacity: 0.5, color: "#000" },
    liner: "#c9a85c",
    linerPattern: { kind: "dots", color: "#f3ead8", opacity: 0.25, tiles: 14 },
    flap: "Pointed",
    seal: { color: "#c9a24a", emblem: "sprig", finish: "metal" },
  },
  {
    id: "kraft",
    name: "Kraft & party sticker",
    paper: "#c49a6c",
    paperPattern: { kind: "stripes", color: "#8a6a44", opacity: 0.18, tiles: 24 },
    liner: "#f2e3c6",
    linerPattern: { kind: "dots", color: "#ff5a5f", opacity: 0.35, tiles: 16 },
    flap: "Arch",
    seal: { color: "#ff5a5f", emblem: "🎉" },
  },
  {
    id: "midnight",
    name: "Midnight & silver wax",
    paper: "#1f2a44",
    paperPattern: { kind: "dots", color: "#b8c0d0", opacity: 0.25, tiles: 18 },
    liner: "#0f1626",
    linerPattern: none,
    flap: "Scalloped",
    seal: { color: "#b8c0d0", emblem: "sprig", finish: "metal" }, 
  },
  {
    id: "celadon-emerald",
    name: "Celadon & emerald wax",
    paper: "#D5F5E3",
    paperPattern: {kind: "image",src: "/patterns/motifs/embossed-snowflake.webp",tiles: 2,opacity: 0.45,color: "#2D6A4F",blend: "multiply",raised: true,},
    flapPaper: "#163B2C",
    flapPattern: none,
    flapMotif: {src: "/patterns/motifs/motif-2-svg-vector.webp",height: 0.85,y: 0.42,opacity: 1.0,tint: "#E2C275",blend: "screen",raised: true,},
    liner: "#81B89A",
    linerPattern: {kind: "image",src: "/patterns/embroidery-pattern.webp",tiles: 1,opacity: 0.25,color: "#0B291D",blend: "overlay",raised: true,},
    flap: "Pointed",
    seal: { color: "#C85A72", emblem: "🌹" },
  },
  {
    id : "wedding",
    name : "Wedding: ivory, gold & burgundy",
    paper : "#450c19",
    paperPattern : { kind : "image", src : "/patterns/embroidery-pattern.webp" , tiles : 0.6, opacity : 0.35 , color : "#000" ,blend : "overlay" , raised : true},
    flapPaper : "#5a1424",
    flapPattern : none,
    flapMotif: { src: "/patterns/motifs/starry-svg-vector.webp", height: 0.85, y: 0.42, opacity: 1.0, tint: "#c9a24a", blend: "screen", raised: true },
    liner : "#1f3a2c",
    linerPattern: { kind : "image", src : "/patterns/embroidery-pattern.webp" , tiles : 1, opacity : 0.18 , color : "#005942" ,blend : "overlay" , raised : true},
    flap : "Scalloped",
    seal : { color: "#c9a24a", emblem: "🌹", finish: "metal" },
  },
];

export const FALLBACK_ENVELOPE = ENVELOPE_THEMES[0];

export function getEnvelopeTheme(id: string): EnvelopeTheme {
  return ENVELOPE_THEMES.find((t) => t.id === id) ?? FALLBACK_ENVELOPE;
}