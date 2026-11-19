import { useEffect,useMemo,useRef,useState } from "react";
import { Canvas,useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { EnvelopeTheme, SurfacePattern } from "@/src/envelopes/theme";


const W = 3.2; // envelope width
const H = 2.2; // envelope height
const FLAP_H = 1.25;
const POCKET_TIP = 0.9;
const FLAP_SEG = 20;


export interface LetterContent {
    guest : string;
    title : string ;
    date : string;
    location : string;
    note : string;
}

type Progress = { seal : number ; flap : number ;  raise : number ;  presnt : number};

const clamp01 = (n : number)  => Math.min(1,Math.max(0,n));
const smooth = (n : number) => n* n * (3 - 2 * n);





/*  --------------------- letys make textures ---------------- */


function grain(g : CanvasRenderingContext2D , size : number) {
    for (let i = 0 ; i < 9000; i++) {
        const light = Math.random() > 0.5;
        g.fillStyle = light ? "rgba(255,255,255,0.05)" : "rgba(60,40,20,0.05)";
        g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1);
    }
}


function paintPattern(g: CanvasRenderingContext2D,size: number,p: SurfacePattern,onLate: () => void,) {
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
            g.globalAlpha = p.opacity;
            g.drawImage(img, 0, 0, size, size);
            g.globalAlpha = 1;
            onLate();
        };
        img.src = p.src;
    }
    g.globalAlpha = 1;
}


function makeSurface(base: string, p: SurfacePattern): THREE.CanvasTexture {
    const size = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    paintPattern(g, size, p, () => {
        tex.needsUpdate = true;
    });
    grain(g, size);
    return tex;
}


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


function wrap(g : CanvasRenderingContext2D , text : string , maxW: number) : string[] {
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
    return lines.slice(0,3);
}

function makeLetterTexture(c: LetterContent, accent: string): THREE.CanvasTexture {
  const CW = 1024;
  const CH = 696;
  const cv = document.createElement("canvas");
  cv.width = CW;
  cv.height = CH;
  const g = cv.getContext("2d")!;
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

  g.fillStyle = accent;
  g.font = "italic 36px Georgia, serif";
  g.fillText(c.guest ? `${c.guest}, you’re invited` : "You’re invited", CW / 2, 140);

  g.fillStyle = "#2b2118";
  fit(g, c.title, CW - 180, 80, (s) => `bold ${s}px Georgia, serif`);
  g.fillText(c.title, CW / 2, 262);

  g.fillStyle = accent;
  g.fillRect(CW / 2 - 60, 300, 120, 3);

  g.fillStyle = "#2b2118";
  g.font = "34px Georgia, serif";
  g.fillText(c.date, CW / 2, 380);
  if (c.location) g.fillText(c.location, CW / 2, 430);

  if (c.note) {
    g.font = "italic 28px Georgia, serif";
    g.fillStyle = "#5a4a3a";
    wrap(g, c.note, CW - 220).forEach((line, i) => g.fillText(line, CW / 2, 510 + i * 40));
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}


/* ---------------- custome wax seal [ Lobby logo to be added leatweer ]: sculpted hieght-field in some uneven pieces ---------------- */

const SEAL_R = 0.3;
const UVR = SEAL_R * 1.15;
const RINGS = 28;
const SEGS = 96;