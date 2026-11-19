"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { shade } from "@/src/lib/color";
import { EnvelopeTheme  } from "@/src/envelopes/theme";


type Stage = "closed" | "seal" | "flap" | "letter" | "done";

const W = 320;
const H = 230;
const POCKET_TIP = H * 0.42; // where the front folds meet
const FLAP_TIP = H * 0.56; // flap point (a little lower than the pocket)
const LW = 288;
const LH = 190;

const NEXT: Partial<Record<Stage, { to: Stage; ms: number }>> = {
  seal: { to: "flap", ms: 600 },
  flap: { to: "letter", ms: 800 },
  letter: { to: "done", ms: 1000 },
};

function grain(freq: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' stitchTiles='stitch'/>` +
    `<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter>` +
    `<rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function SealArt({kind,color,emblem,idp,}:{kind : "wax" | "sticker";color : string;emblem : string;idp : string;}) {
  const light = shade(color,0.4);
  const dark = shade(color, -0.4);

  if(kind === "sticker") {
    return ( 
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        style={{ filter : "drop-shadow(0 2px 2px rgba(0,0,0,.35))" }}
      >
        <circle cx="32" cy="32" r="30" fill="#fff" />
        <circle cx="32" cy="32" r="26" fill={color} />
        <text x="32" y="33" textAnchor="middle" dominantBaseline="central" fontSize="28">
          {emblem}
        </text>
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      style={{ filter : "drop-shadow(0 3px 3px rgba(0,0,0,.45))" }}
    >
      <defs>
        <radialGradient id={`${idp}-w`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${idp}-w)`} />
      <circle cx="32" cy="32" r="21" fill="none" stroke={dark} strokeOpacity=".55" strokeWidth="2" />
      <circle cx="32" cy="32" r="22.5" fill="none" stroke={light} strokeOpacity=".35" strokeWidth="1" />
      <text x="32.8" y="33.8" textAnchor="middle" dominantBaseline="central" fontSize="22" fill={light} fillOpacity=".5">
        {emblem}
      </text>
      <text x="32" y="33" textAnchor="middle" dominantBaseline="central" fontSize="22" fill={dark}>
        {emblem}
      </text>
    </svg>
  )
}


function Grain({ texture }: { texture: string | null }) {
  if (!texture) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: texture, opacity: 0.14 }}
    />
  );
}

export interface EnvelopeProps {
  theme: EnvelopeTheme;
  children: ReactNode; // the letter / invitation card
  accent?: string; 
  emblem?: string; 
  onOpened?: () => void;
}

export default function Envelope({ theme, children, accent, emblem, onOpened }: EnvelopeProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const k = reduce ? 0 : 1; // multiplies durations

  const [stage, setStage] = useState<Stage>("closed");
  const openedRef = useRef(onOpened);
  useEffect(() => {
    openedRef.current = onOpened;
  });

  useEffect(() => {
    const step = NEXT[stage];
    if (!step) return;
    const t = setTimeout(() => {
      setStage(step.to);
      if (step.to === "done") openedRef.current?.();
    }, step.ms * k);
    return () => clearTimeout(t);
  }, [stage, k]);

  const open = () => {
    if (stage !== "closed") return;
    setStage("seal");
  };

  const paperLight = shade(theme.paper, 0.14);
  const paperDark = shade(theme.paper, -0.14);
  const linerDark = shade(theme.liner, -0.2);
  const sealColor = accent ?? theme.seal.color;
  const sealEmblem = emblem ?? theme.seal.emblem;
  const texture =
    theme.texture === "none" ? null : grain(theme.texture === "linen" ? "0.9 0.05" : "0.8");

  const broken = stage !== "closed";
  const flapOpen = stage === "flap" || stage === "letter" || stage === "done";
  const faceStyle = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  } as const;
  const triangle = "polygon(0 0, 100% 0, 50% 100%)";

  return (
    <div className="relative" style={{ width: W, height: H, perspective: 1100 }}>
      {/* ground shadow */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "6%",
          right: "6%",
          bottom: -22,
          height: 26,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,.45), transparent 70%)",
        }}
      />

      {/* 1. inside back */}
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          zIndex: 0,
          background: `linear-gradient(to bottom, ${linerDark}, ${theme.liner})`,
          boxShadow: "0 18px 36px rgba(0,0,0,.4)",
        }}
      />

      {/* 2. the letter */}
      <motion.div
        className="absolute overflow-hidden rounded-md shadow-xl"
        style={{
          left: (W - LW) / 2,
          top: 14,
          width: LW,
          height: LH,
          background: "#fffdf8",
          zIndex: stage === "done" ? 20 : 5,
        }}
        initial={false}
        animate={{
          y: stage === "letter" ? -96 : stage === "done" ? -40 : 0,
          scale: stage === "done" ? 1.12 : 1,
        }}
        transition={{ type: "spring", stiffness: 60, damping: 15, duration: 0.9 * k }}
      >
        {children}
      </motion.div>

      {/* 3. front pocket: three folded panels */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          clipPath: `polygon(0 0, 50% ${(POCKET_TIP / H) * 100}%, 100% 0, 100% 100%, 0 100%)`,
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id={`${uid}-l`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={paperLight} />
              <stop offset="100%" stopColor={theme.paper} />
            </linearGradient>
            <linearGradient id={`${uid}-r`} x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor={paperDark} />
              <stop offset="100%" stopColor={theme.paper} />
            </linearGradient>
            <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.paper} />
              <stop offset="100%" stopColor={paperLight} />
            </linearGradient>
          </defs>
          <polygon points={`0,0 ${W / 2},${POCKET_TIP} 0,${H}`} fill={`url(#${uid}-l)`} />
          <polygon points={`${W},0 ${W / 2},${POCKET_TIP} ${W},${H}`} fill={`url(#${uid}-r)`} />
          <polygon points={`0,${H} ${W / 2},${POCKET_TIP} ${W},${H}`} fill={`url(#${uid}-b)`} />
          <path
            d={`M0 0 L${W / 2} ${POCKET_TIP} L${W} 0 M0 ${H} L${W / 2} ${POCKET_TIP} L${W} ${H}`}
            fill="none"
            stroke={paperDark}
            strokeOpacity=".6"
            strokeWidth="1"
          />
        </svg>
        <Grain texture={texture} />
      </div>

      {/* 4. the flap: two faces so you see the liner once it is open */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ width: W, height: FLAP_TIP, transformOrigin: "top", transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateX: flapOpen ? 180 : 0, zIndex: flapOpen ? 2 : 30 }}
        transition={{
          rotateX: { duration: 0.8 * k, ease: "easeInOut" },
          zIndex: { delay: flapOpen ? 0.4 * k : 0, duration: 0 },
        }}
      >
        {/* outside */}
        <div className="absolute inset-0" style={faceStyle}>
          <div
            className="absolute inset-0"
            style={{
              clipPath: triangle,
              background: `linear-gradient(to bottom, ${paperLight}, ${theme.paper} 55%, ${paperDark})`,
            }}
          >
            <Grain texture={texture} />
          </div>
        </div>
        {/* inside (seen after it flips) */}
        <div className="absolute inset-0" style={{ ...faceStyle, transform: "rotateY(180deg)" }}>
          <div
            className="absolute inset-0"
            style={{
              clipPath: triangle,
              background: `linear-gradient(to bottom, ${theme.liner}, ${linerDark})`,
            }}
          />
        </div>
      </motion.div>

      {/* 5. the seal: two halves that crack apart */}
      <motion.div
        className="absolute"
        style={{ left: W / 2 - 32, top: FLAP_TIP - 32, width: 64, height: 64, zIndex: 40 }}
        animate={broken ? { scale: 1 } : { scale: [1, 1.07, 1] }}
        transition={broken ? { duration: 0.2 } : { duration: 1.8, repeat: Infinity }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: "inset(0 50% 0 0)" }}
          initial={false}
          animate={broken ? { x: -26, y: 34, rotate: -28, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6 * k, ease: "easeIn" }}
        >
          <SealArt kind={theme.seal.kind} color={sealColor} emblem={sealEmblem} idp={`${uid}a`} />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: "inset(0 0 0 50%)" }}
          initial={false}
          animate={broken ? { x: 26, y: 40, rotate: 28, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6 * k, ease: "easeIn" }}
        >
          <SealArt kind={theme.seal.kind} color={sealColor} emblem={sealEmblem} idp={`${uid}b`} />
        </motion.div>
        <button
          type="button"
          onClick={open}
          disabled={stage !== "closed"}
          aria-label="Break the seal to open the invitation"
          className="absolute inset-0 rounded-full"
        />
      </motion.div>
    </div>
  );
}