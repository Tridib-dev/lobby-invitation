"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { EnvelopeTheme, SurfacePattern, flapMotif } from "@/src/envelopes/theme";
import { paintMotif, makeMotifBump } from "./textures/motif";
import { FLAP_SHAPES, type flapShapeId } from "@/src/envelopes/flapShapes";


export interface LetterContent {
  guest: string;
  title: string;
  date: string; // already formatted for display
  location: string;
  note: string;
}

const W = 3.2;
const H = 2.2;
const FLAP_H = 1.25;
const POCKET_TIP = 0.9;
const FLAP_SEG = 96;

// depth layout (z axis, towards the camera)
const BACK_DEPTH = 0.05;
const Z_LETTER = 0.02;
const Z_POCKET = 0.05;
const POCKET_DEPTH = 0.03;
const Z_FRONT = Z_POCKET + POCKET_DEPTH + 0.01; // front surface of the pocket
const Z_FLAP_CLOSED = Z_FRONT + 0.035;
const Z_FLAP_OPEN = -0.03;

const LW = 2.6; // letter sizeee
const LH = 1.77;
const LETTER_Y0 = -0.02;
const LETTER_RISE_Y = 1.9; 

type Progress = { seal: number; flap: number; pull: number };
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (n: number) => n * n * (3 - 2 * n);

function shadeHex(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.min(1, Math.abs(amount));
  const ch = (v: number) => Math.round(v + (target - v) * t);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* ---------------- textures ---------------- */

function grain(g: CanvasRenderingContext2D, size: number) {
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(60,40,20,0.05)";
    g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1);
  }
}

function paintPattern(g: CanvasRenderingContext2D, size: number, p: SurfacePattern, onLate: () => void) {
  if (p.kind === "none") return;
  const step = size / p.tiles;
  g.globalAlpha = p.opacity;
  g.fillStyle = p.color;
  g.strokeStyle = p.color;
  g.lineWidth = Math.max(1, step * 0.06);

  if (p.kind === "dots") {
    for (let row = 0, y = step / 2; y < size; y += step, row++) {
      for (let x = step / 2 + (row % 2) * (step / 2); x < size; x += step) {
        g.beginPath();
        g.arc(x, y, step * 0.1, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (p.kind === "stripes") {
    for (let x = 0; x < size; x += step) g.fillRect(x, 0, step / 2, size);
  } else if (p.kind === "diamonds") {
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        g.beginPath();
        g.moveTo(x + step / 2, y);
        g.lineTo(x + step, y + step / 2);
        g.lineTo(x + step / 2, y + step);
        g.lineTo(x, y + step / 2);
        g.closePath();
        g.stroke();
      }
    }
  } else if (p.kind === "image" && p.src) {
    const img = new Image();
    img.onload = () => {
      g.save();
      g.globalCompositeOperation = p.blend ?? "multiply";
      g.globalAlpha = p.opacity;
      const w = size / p.tiles;
      const h = w * (img.height / img.width);

      for (let y = 0 ; y < size; y += h) {
        for ( let x = 0 ; x < size ;x += w) g.drawImage(img , x , y, w, h);
      }
      g.restore();
      onLate();
    };
    img.onerror = () => onLate();
    img.src = p.src;
  }
  g.globalAlpha = 1;
}

function makeSurface(base: string, p: SurfacePattern, border?: string, aspect = 1, motif?: flapMotif): THREE.CanvasTexture {
  const size = 2048;
  const height = Math.round(size * aspect);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = height;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, c.height);
  if (border) {
      const m = size * 0.05;
      g.fillStyle = border;
      g.fillRect(0, 0, size, height);
      g.fillStyle = base;
      g.fillRect(m, m, size - 2 * m, height - 2 * m);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  const finish = () => {
    grain(g,size);
    const shade = g.createLinearGradient(0,0,0,height);
    shade.addColorStop(0,"rgba(255,255,255,0.07)");
    shade.addColorStop(0,"rgba(0,0,0,0.16)");
    g.fillStyle = shade;
    g.fillRect( 0, 0, size , height);
    g.strokeStyle = "rgba(0,0,0,0.3)";
    g.lineWidth = size * 0.012;
    g.strokeRect(0,0,size,height);
    tex.needsUpdate = true;
  };
  let pending = (p.kind === "image" && p.src ? 1 : 0) + (motif ? 1 : 0);
  const done = () => {pending -= 1;
    if (pending <= 0) finish();
  };
  paintPattern(g,size,p,done);
  if (motif) paintMotif(g, size, height, motif, done);
  if ( pending === 0 ) finish();
  return tex;
}


function makeFlapInside(base: string, border: string, p: SurfacePattern, shape: flapShapeId, d = 0.14): THREE.CanvasTexture {
  const size = 2048;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = Math.round((size * FLAP_H) / W);
  const g = c.getContext("2d")!;
  g.fillStyle = border;
  g.fillRect(0, 0, size, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;

  const prof = FLAP_SHAPES[shape];
  const tx = (x: number) => ((x + W / 2) / W) * size;
  const ty = (t: number) => t * c.height;
  const dx = d * 1.3;
  const pts: { t: number; x: number }[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = Math.sin(((i / 96) * Math.PI) / 2);
    const x = (W / 2) * prof(t) - dx;
    if (x <= 0) break;
    pts.push({ t, x });
  }

  g.fillStyle = base;
  g.beginPath();
  g.moveTo(tx(-pts[0].x), 0);
  pts.forEach((q) => g.lineTo(tx(-q.x), ty(q.t)));
  for (let i = pts.length - 1; i >= 0; i--) g.lineTo(tx(pts[i].x), ty(pts[i].t));
  g.closePath();
  g.fill();

  g.save();
  g.clip();
  paintPattern(g, size, p, () => {
    tex.needsUpdate = true;
  });
  g.restore();

  grain(g, size);
  tex.needsUpdate = true;
  return tex;
}


// function makeEmbossBump(p:SurfacePattern,fallback : THREE.Texture,aspect=1) : THREE.Texture {
//     if (p.kind !== "image" || !p.src || !p.raised) return fallback;
//     const size = 2048;
//     const c = document.createElement("canvas");
//     c.width = size;
//     c.height = Math.round(size * aspect);
//     const g = c.getContext("2d")!;
//     g.fillStyle = "#000";
//     g.fillRect(0,0,size,c.height);
//     const tex = new THREE.CanvasTexture(c);
//     const img = new Image();
//     img.onload= () => {
//         g.filter = "blur(2px)";
//         const w = size / p.tiles;
//         const h = w * (img.height / img.width);
//         for (let y = 0; y < size; y += h) {
//           for (let x = 0; x < size; x += w) g.drawImage(img, x, y, w, h);
//         }
//         tex.needsUpdate = true;
//     };
//     img.src = p.src;
//     return tex;
// }


function makePaperBump(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 190 + Math.random() * 65;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 3);
  return t;
}

function fit(g: CanvasRenderingContext2D, text: string, maxW: number, start: number, font: (s: number) => string) {
  let s = start;
  g.font = font(s);
  while (g.measureText(text).width > maxW && s > 20) {
    s -= 2;
    g.font = font(s);
  }
}

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const t = cur ? `${cur} ${word}` : word;
    if (g.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = t;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function makeLetterTexture(c: LetterContent, accent: string): THREE.CanvasTexture {
  const CW = 1024;
  const CH = 696;
  const S = 2;
  const cv = document.createElement("canvas");
  cv.width = CW * S;
  cv.height = CH * S;
  const g = cv.getContext("2d")!;
  g.scale(S,S);
  g.fillStyle = "#fffaf0";
  g.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = `rgba(120,100,70,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * CW, Math.random() * CH, 1 + Math.random() * 3, 1);
  }
  g.strokeStyle = accent;
  g.lineWidth = 3;
  g.strokeRect(36, 36, CW - 72, CH - 72);
  g.lineWidth = 1;
  g.strokeRect(48, 48, CW - 96, CH - 96);

  g.textAlign = "center";
  g.textBaseline = "alphabetic";

  g.fillStyle = "#6b5a3a";
  g.font = "italic bold 40px Georgia, serif";
  g.fillText(c.guest ? `${c.guest}, you’re invited` : "You’re invited", CW / 2, 140);

  g.fillStyle = "#2b2118";
  fit(g, c.title, CW - 180, 80, (s) => `bold ${s}px Georgia, serif`);
  g.fillText(c.title, CW / 2, 262);

  g.fillStyle = accent;
  g.fillRect(CW / 2 - 60, 300, 120, 3);

  g.fillStyle = "#2b2118";
  g.font = "bold 38px Georgia, serif";
  g.fillText(c.date, CW / 2, 380);
  if (c.location) g.fillText(c.location, CW / 2, 430);

  if (c.note) {
    g.font = "italic bold 32px Georgia, serif";
    g.fillStyle = "#2b2118";
    wrap(g, c.note, CW - 220).forEach((line, i) => g.fillText(line, CW / 2, 510 + i * 40));
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ---------------- wax seal ---------------- */

const SEAL_R = 0.36;
const UVR = SEAL_R * 1.15;
const RINGS = 40;
const SEGS = 128;

const radiusAt = (a: number) =>
  SEAL_R * (1 + 0.018 * Math.sin(3 * a + 1) + 0.012 * Math.sin(5 * a + 2));

function profile(rn: number): number {
  const edge = smooth(clamp01((1 - rn) / 0.12));
  const rim = Math.exp(-(((rn - 0.72) / 0.06) ** 2)) * 0.04;
  return 0.09 * edge + rim;
}

const CUTS = [0.3, 2.3, 4.2];

type SealPiece = { geo: THREE.BufferGeometry; centroid: THREE.Vector3 };

function buildSealPieces(): SealPiece[] {
  const count = (RINGS + 1) * SEGS;
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  for (let j = 0; j <= RINGS; j++) {
    const rn = j / RINGS;
    for (let i = 0; i < SEGS; i++) {
      const a = (i / SEGS) * Math.PI * 2;
      const r = rn * radiusAt(a);
      const k = j * SEGS + i;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      pos[k * 3] = x;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = profile(rn);
      uv[k * 2] = 0.5 + x / (2 * UVR);
      uv[k * 2 + 1] = 0.5 + y / (2 * UVR);
    }
  }
  const idx: number[] = [];
  for (let j = 1; j <= RINGS; j++) {
    for (let i = 0; i < SEGS; i++) {
      const i2 = (i + 1) % SEGS;
      const a = (j - 1) * SEGS + i;
      const b = (j - 1) * SEGS + i2;
      const c = j * SEGS + i;
      const d = j * SEGS + i2;
      idx.push(a, c, b, b, c, d);
    }
  }
  const full = new THREE.BufferGeometry();
  full.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  full.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  full.setIndex(idx);
  full.computeVertexNormals();
  const nor = full.getAttribute("normal").array as Float32Array;

  const groups: number[][] = [[], [], []];
  for (let t = 0; t < idx.length; t += 3) {
    const v = [idx[t], idx[t + 1], idx[t + 2]];
    const cx = (pos[v[0] * 3] + pos[v[1] * 3] + pos[v[2] * 3]) / 3;
    const cy = (pos[v[0] * 3 + 1] + pos[v[1] * 3 + 1] + pos[v[2] * 3 + 1]) / 3;
    const ang = Math.atan2(cy, cx);
    const rc = Math.hypot(cx, cy) / SEAL_R;
    const aj = ang + 0.12 * Math.sin(rc * 16 + ang * 3);
    const twoPi = Math.PI * 2;
    const rel = (((aj - CUTS[0]) % twoPi) + twoPi) % twoPi;
    const s = rel >= CUTS[2] - CUTS[0] ? 2 : rel >= CUTS[1] - CUTS[0] ? 1 : 0;
    groups[s].push(...v);
  }

  return groups.map((g) => {
    const n = g.length;
    const p = new Float32Array(n * 3);
    const nm = new Float32Array(n * 3);
    const u = new Float32Array(n * 2);
    const centroid = new THREE.Vector3();
    g.forEach((vi, k) => {
      p[k * 3] = pos[vi * 3];
      p[k * 3 + 1] = pos[vi * 3 + 1];
      p[k * 3 + 2] = pos[vi * 3 + 2];
      nm[k * 3] = nor[vi * 3];
      nm[k * 3 + 1] = nor[vi * 3 + 1];
      nm[k * 3 + 2] = nor[vi * 3 + 2];
      u[k * 2] = uv[vi * 2];
      u[k * 2 + 1] = uv[vi * 2 + 1];
      centroid.x += p[k * 3];
      centroid.y += p[k * 3 + 1];
      centroid.z += p[k * 3 + 2];
    });
    centroid.divideScalar(n);
    for (let k = 0; k < n; k++) {
      p[k * 3] -= centroid.x;
      p[k * 3 + 1] -= centroid.y;
      p[k * 3 + 2] -= centroid.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(nm, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(u, 2));
    return { geo, centroid };
  });
}

function drawSprig(g: CanvasRenderingContext2D, S: number) {
  g.save();
  g.translate(S / 2, S / 2);
  g.scale(1.15, 1.15);
  g.lineCap = "round";
  g.lineWidth = S * 0.018;
  g.beginPath();
  g.moveTo(0, S * 0.2);
  g.quadraticCurveTo(S * 0.02, 0, 0, -S * 0.2);
  g.stroke();
  for (let i = 0; i < 5; i++) {
    const y = S * 0.14 - i * S * 0.07;
    const len = S * (0.13 - i * 0.012);
    for (const side of [-1, 1]) {
      g.save();
      g.translate(0, y);
      g.rotate(side * 0.9);
      g.beginPath();
      g.ellipse(0, -len / 2, len * 0.28, len / 2, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  g.beginPath();
  g.ellipse(0, -S * 0.2, S * 0.035, S * 0.06, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function emblemCanvas(emblem: string, size: number, fill: string, fontPx: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  if (emblem === "sprig") {
    g.fillStyle = "#000";
    g.strokeStyle = "#000";
    drawSprig(g, size);
  } else {
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `${fontPx}px serif`;
    g.fillText(emblem, size / 2, size / 2 + fontPx * 0.04);
  }
  g.globalCompositeOperation = "source-in";
  g.fillStyle = fill;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeSealTextures(emblem: string, color: string,  metal: boolean) {
    const S = 1024;
    const FONT = 420;

    const mc = document.createElement("canvas");
    mc.width = mc.height = S;
    const g = mc.getContext("2d")!;
    g.fillStyle = color;
    g.fillRect(0, 0, S, S);
    const grad = g.createRadialGradient(S * 0.38, S * 0.34, 10, S / 2, S / 2, S * 0.55);
    grad.addColorStop(0, "rgba(255,255,255,0.2)");
    grad.addColorStop(1, "rgba(0,0,0,0.3)");
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = "rgba(0,0,0,0.3)";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(S / 2, S / 2, 316, 0, Math.PI * 2);
    g.stroke();
    if (metal) {
        g.fillStyle = shadeHex(color, -0.4); 
        g.beginPath();
        g.arc(S / 2, S / 2, 316, 0, Math.PI * 2);
        g.fill();
        g.drawImage(emblemCanvas(emblem, S, shadeHex(color, -0.75), FONT), 6, 6); 
        g.drawImage(emblemCanvas(emblem, S, shadeHex(color, 0.18), FONT), 0, 0); 
    } else {
        g.drawImage(emblemCanvas(emblem, S, shadeHex(color, -0.55), FONT), 0, 0);
    }
    const map = new THREE.CanvasTexture(mc);
    map.colorSpace = THREE.SRGBColorSpace;

    const hc = document.createElement("canvas");
    hc.width = hc.height = S;
    const h = hc.getContext("2d")!;
    h.fillStyle = "#000";
    h.fillRect(0, 0, S, S);
    h.fillStyle = "#3a3a3a";
    h.beginPath();
    h.arc(S / 2, S / 2, 316, 0, Math.PI * 2);
    h.fill();
    h.strokeStyle = "#fff";
    h.lineWidth = 20;
    h.beginPath();
    h.arc(S / 2, S / 2, 316, 0, Math.PI * 2);
    h.stroke();
    h.drawImage(emblemCanvas(emblem, S, "#fff", FONT), 0, 0);
    const height = new THREE.CanvasTexture(hc);
    map.anisotropy = 8;
    height.anisotropy = 8;

    return { map, height };
}

const PIECES = [
  { delay: 0.0, dx: -0.7, dy: -1.7, rz: -1.4, rx: 0.9 },
  { delay: 0.18, dx: 0.5, dy: -2.1, rz: 1.1, rx: -0.6 },
  { delay: 0.33, dx: 0.95, dy: -1.4, rz: 2.0, rx: 0.4 },
];

function Seal({ P, color, emblem, metal, onOpen }: { P: React.RefObject<Progress>; color: string; emblem: string; metal: boolean; onOpen: () => void; }) {
    const pieces = useMemo(() => buildSealPieces(), []);
    const tex = useMemo(() => makeSealTextures(emblem, color, metal), [emblem, color, metal]);  const refs = useRef<(THREE.Mesh | null)[]>([]);
    const mats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);

    useFrame(() => {
        const s = P.current.seal;
        PIECES.forEach((p, i) => {
        const m = refs.current[i];
        const mat = mats.current[i];
        if (!m || !mat) return;
        const c = pieces[i].centroid;
        const t = clamp01((s - p.delay) / 0.62);
        const e = t * t;
        m.position.set(c.x + p.dx * e * 0.6, c.y + p.dy * e * 0.7 + Math.sin(t * Math.PI) * 0.08, c.z + e * 0.5);
        m.rotation.set(p.rx * e, 0, p.rz * e);
        mat.opacity = 1 - smooth(clamp01((t - 0.65) / 0.35));
        });
    });

    return (
        <group
        position={[0, H / 2 - FLAP_H, Z_FLAP_CLOSED + 0.05]}
        onClick={onOpen}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
        >
        {pieces.map((pc, i) => (
            <mesh
            key={i}
            ref={(el) => {
                refs.current[i] = el;
            }}
            geometry={pc.geo}
            position={pc.centroid}
            castShadow
            >
            <meshPhysicalMaterial
                ref={(el) => {
                mats.current[i] = el;
                }}
                map={tex.map}
                bumpMap={tex.height}
                bumpScale={metal ? 2.5 : 2}
                metalness={metal ? 0.9 : 0}
                roughness={metal ? 0.38 : 0.3}
                clearcoat={metal ? 0 : 0.85}
                clearcoatRoughness={0.18}
                side={THREE.DoubleSide}
                envMapIntensity={metal ? 1.1 : 1}
                transparent
            />
            </mesh>
        ))}
        </group>
    );
}

/* ---------------- flap ---------------- */

function Flap({
  P,
  outside,
  inside,
  shape,
  bump,
  outsideBump
}: {
  P: React.RefObject<Progress>;
  outside: THREE.Texture;
  inside: THREE.Texture;
  shape: flapShapeId;
  bump: THREE.Texture;
  outsideBump: THREE.Texture;
}) {
  const geo = useMemo(() => new THREE.PlaneGeometry(W, FLAP_H, 1, FLAP_SEG), []);
  const ts = useMemo(() => Array.from({ length : FLAP_SEG + 1 }, (_ , i) => Math.sin(((i / FLAP_SEG) * Math.PI) / 2)),[]);
  const hinge = useRef<THREE.Group>(null);
  const front = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const g = front.current?.geometry;
    if (!g) return;
    const f = P.current.flap;
    const angle = f * Math.PI * 0.985;
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const prof = FLAP_SHAPES[shape];
    let y = 0;
    let z = 0;
    for (let i = 0; i <= FLAP_SEG; i++) {
      const t = ts[i];
      const a = angle * (1 + 0.15 * t * Math.sin(angle));
      const half = (W / 2) * prof(t)
      pos.setXYZ(i * 2, -half, y, z);
      pos.setXYZ(i * 2 + 1, half, y, z);
      uv.setXY(i * 2, 0.5 - half / W, 1 - t);
      uv.setXY(i * 2 + 1, 0.5 + half / W, 1 - t);
      const dy = FLAP_H * ((ts[i + 1] ?? 1) - t);
      y -= Math.cos(a) * dy;
      z += Math.sin(a) * dy;
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    g.computeVertexNormals();
   
    if (hinge.current) {
      hinge.current.position.z = THREE.MathUtils.lerp(
        Z_FLAP_CLOSED,
        Z_FLAP_OPEN,
        smooth(clamp01((f - 0.35) / 0.5)),
      );
    }
  });

  return (
    <group ref={hinge} position={[0, H / 2, Z_FLAP_CLOSED]}>
      <mesh ref={front} geometry={geo}  castShadow receiveShadow>
        <meshStandardMaterial map={outside} roughness={0.85} bumpMap={outsideBump} bumpScale={3} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geo}>
        <meshStandardMaterial map={inside} roughness={0.85} bumpMap={bump} bumpScale={0.6} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// soft shadow the closed flap throws onto the pocket; fades as the flap lifts
function FlapShadow({ P, shape }: { P: React.RefObject<Progress>; shape: flapShapeId }) {
  const geo = useMemo(() => {
    const prof = FLAP_SHAPES[shape];
    const N = 48;
    const right: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const t = Math.sin(((i / N) * Math.PI) / 2);
      right.push([Math.max(0, (W / 2) * prof(t) - 0.1), H / 2 - 0.02 - t * (FLAP_H - 0.02)]);
    }
    const s = new THREE.Shape();
    s.moveTo(-right[0][0], right[0][1]);
    right.forEach(([x, y]) => s.lineTo(x, y));
    for (let i = right.length - 1; i >= 0; i--) s.lineTo(-right[i][0], right[i][1]);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [shape]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const layers = [
    { dx: 0.03, dy: -0.05, a: 0.16 },
    { dx: 0.06, dy: -0.1, a: 0.12 },
    { dx: 0.1, dy: -0.17, a: 0.08 },
  ];

  useFrame(() => {
    const k = 1 - clamp01(P.current.flap * 2.2);
    mats.current.forEach((m, i) => {
      if (m) m.opacity = layers[i].a * k;
    });
  });

  return (
    <group position={[0, 0, Z_FRONT + 0.008]}>
      {layers.map((l, i) => (
        <mesh key={i} geometry={geo} position={[l.dx, l.dy, 0]}>
          <meshBasicMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            color="#000"
            transparent
            opacity={l.a}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- letter ---------------- */

function Letter({
  P,
  map,
  bump,
}: {
  P: React.RefObject<Progress>;
  map: THREE.Texture;
  bump: THREE.Texture;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const geo = useMemo(() => new THREE.PlaneGeometry(LW, LH, 12, 8), []);

    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const u = P.current.pull;

        const up = clamp01(u / 0.6);
        const rise = 1 - (1 - up) * (1 - up); // fast start, eases out
        const d = clamp01((u - 0.5) / 0.5);
        const zq = smooth(clamp01(d / 0.35)); // comes forward once clear of the pocket
        const yq = smooth(clamp01((d - 0.35) / 0.65)); // then settles to centre
        const hand = Math.sin(Math.PI * up) * (1 - zq);

        const y = THREE.MathUtils.lerp(THREE.MathUtils.lerp(LETTER_Y0, LETTER_RISE_Y, rise), 0.3, yq);
        const z = Z_LETTER + 0.35 * zq + 1.2 * yq;

        m.position.set(0, y, z);
        m.rotation.set(-0.06 * yq, 0, 0.035 * hand);
        m.scale.setScalar(1 + 0.25 * yq);

        const bow = 0.05 * hand;
        const g = m.geometry;
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const t = (pos.getY(i) / (LH / 2) + 1) / 2;
            pos.setZ(i, bow * t * t * t);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
    });

  return (
    <mesh ref={ref} geometry={geo} position={[0, LETTER_Y0, Z_LETTER]} castShadow receiveShadow>
        <meshStandardMaterial map={map} roughness={0.9} bumpMap={bump} bumpScale={0.35} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ---------------- thick envelope body ---------------- */

function fitUV(g: THREE.BufferGeometry) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) + W / 2) / W;
    uv[i * 2 + 1] = (p.getY(i) + H / 2) / H;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function backGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, -H / 2);
  s.lineTo(W / 2, -H / 2);
  s.lineTo(W / 2, H / 2);
  s.lineTo(-W / 2, H / 2);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: BACK_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  fitUV(g);
  return g;
}

function pocketGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, H / 2);
  s.lineTo(0, H / 2 - POCKET_TIP);
  s.lineTo(W / 2, H / 2);
  s.lineTo(W / 2, -H / 2);
  s.lineTo(-W / 2, -H / 2);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: POCKET_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  fitUV(g);
  return g;
}

/* ---------------- scene ---------------- */



function Scene({
  open,
  theme,
  letter,
  accent,
  onOpen,
  onOpened,
}: {
  open: boolean;
  theme: EnvelopeTheme;
  letter: LetterContent;
  accent?: string;
  onOpen: () => void;
  onOpened?: () => void;
}) {
    const P = useRef<Progress>({ seal: 0, flap: 0, pull: 0 });
    const rig = useRef<THREE.Group>(null);
    const bump = useMemo(() => makePaperBump(), []);
    const back = useMemo(() => backGeometry(), []);
    const pocket = useMemo(() => pocketGeometry(), []);
    const outside = useMemo(() => makeSurface(theme.paper, theme.paperPattern), [theme]);
    const inside = useMemo(() => makeSurface(theme.liner, theme.linerPattern, theme.paper), [theme]);
    const flapOutside = useMemo(() => makeSurface(theme.flapPaper ?? theme.paper, theme.flapPattern ?? theme.paperPattern, undefined, FLAP_H / W, theme.flapMotif), [theme]);
    const flapBump = useMemo(() => makeMotifBump(theme.flapMotif, 2048, Math.round((2048 * FLAP_H) / W), bump), [theme, bump]);
    const flapInside = useMemo(() => makeFlapInside(theme.liner, theme.paper, theme.linerPattern, theme.flap), [theme]);
    const sealColor = theme.seal.finish === "metal" ? theme.seal.color : (accent ?? theme.seal.color);
    const letterTex = useMemo(() => makeLetterTexture(letter, sealColor), [letter, sealColor]);

    const openedRef = useRef(onOpened);
    useEffect(() => {
        openedRef.current = onOpened;
    });

    useEffect(() => {
        if (!open) return;
        const p = P.current;
        const tl = gsap.timeline({ onComplete: () => openedRef.current?.() });
        tl.to(p, { seal: 1, duration: 0.9, ease: "power2.out" }, 0)
            .addLabel("flap", 0.35)
            .to(p, { flap: 1, duration: 0.9, ease: "power2.inOut" }, "flap")
            .to(p, { pull: 1, duration: 2.2, ease: "power1.inOut" }, "flap+=0.8");
        return () => {
            tl.kill();
        };
    }, [open]);

    useFrame(() => {
        const g = rig.current;
        if (!g) return;
        const k = 1 - smooth(clamp01((P.current.pull - 0.5) / 0.5));
        g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -0.2 * k, 0.08);
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, 0.22 * k, 0.08);
    });

    return (
        <>
            <Environment resolution={256}>
                <Lightformer form="rect" intensity={4} position={[0, 5, 5]} scale={[10, 4, 1]} target={[0, 0, 0]} />
                <Lightformer form="rect" intensity={2} position={[-5, 1, 3]} scale={[4, 6, 1]} target={[0, 0, 0]} />
                <color attach="background" args={["#3a352e"]} />
                <Lightformer form="ring" intensity={3} color="#fff1cc" position={[0, 2, 4]} scale={3} target={[0, 0, 0]} />
                <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[3, -1, 4]} scale={[2, 5, 1]} target={[0, 0, 0]} />
            </Environment>
            <hemisphereLight args={["#fff4e6", "#2a2438", 0.3]} />
            <directionalLight
                position={[-3.5, 4.5, 6]}
                intensity={2.6}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-radius={5}
                shadow-bias={-0.0004}
                shadow-normalBias={0.02}
                shadow-camera-left={-4}
                shadow-camera-right={4}
                shadow-camera-top={4}
                shadow-camera-bottom={-4}
            />

            <group ref={rig} position={[0, -0.3, 0]}>
                {/* thick back panel: liner on the inside, paper on the edges */}
                <mesh geometry={back} position={[0, 0, -(BACK_DEPTH + 0.01)]} receiveShadow castShadow>
                <meshStandardMaterial attach="material-0" map={inside} roughness={0.9} bumpMap={bump} bumpScale={0.5} />
                <meshStandardMaterial attach="material-1" map={outside} color="#cfcfcf" roughness={0.9} />
                </mesh>

                <Letter P={P} map={letterTex} bump={bump} />

                {/* thick front pocket */}
                <mesh geometry={pocket} position={[0, 0, Z_POCKET]} castShadow receiveShadow>
                    <meshStandardMaterial attach="material-0" map={outside} roughness={0.88} bumpMap={bump} bumpScale={0.5} />
                    <meshStandardMaterial attach="material-1" map={outside} color="#cfcfcf" roughness={0.9} />
                </mesh>

                <FlapShadow P={P} shape={theme.flap}/>
                <Flap P={P} outside={flapOutside} inside={flapInside} shape={theme.flap} bump={bump} outsideBump={flapBump} />
                <Seal P={P} color={sealColor} emblem={theme.seal.emblem} metal={theme.seal.finish === "metal"} onOpen={onOpen} />
            </group>

            <ContactShadows position={[0, -H / 2 - 0.5, 0]} opacity={0.5} scale={9} blur={2.6} far={3} />
        </>
    );
}

export default function Envelope3D({
  theme,
  letter,
  accent,
  onOpened,
}: {
  theme: EnvelopeTheme;
  letter: LetterContent;
  accent?: string;
  onOpened?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 720, height: 560 }}>
      <Canvas shadows="soft" camera={{ position: [0.3, 0.9, 9.2], fov: 35, near: 0.5, far: 30 }} dpr={[3, 3]}>
        <Scene
          open={open}
          theme={theme}
          letter={letter}
          accent={accent}
          onOpen={() => setOpen(true)}
          onOpened={onOpened}
        />
      </Canvas>
    </div>
  );
}