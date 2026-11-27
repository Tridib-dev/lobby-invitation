"use client";

import "./card.css";
import { useEffect, useMemo, useRef } from "react";
import { useImagePreload } from "./useImagePreload";
import { slotText, type CardSpec, type CardTexts, type SlotFont } from "@/src/cards/spec";

export type Selection = { kind: "layer" | "slot"; id: string } | null;

export interface EditorApi {
  selected: Selection;
  onSelect: (sel: Selection) => void;
  onMove: (kind: "layer" | "slot", id: string, x: number, y: number) => void;
}

const FONTS: Record<SlotFont, string> = {
  serif: 'Georgia, "Times New Roman", "Noto Serif Bengali", serif',
  script: '"Snell Roundhand", "Brush Script MT", "Noto Serif Bengali", cursive',
  sans: 'system-ui, -apple-system, "Segoe UI", "Noto Sans Bengali", sans-serif',
};

const round = (n: number) => Math.round(n * 10) / 10;

type Drag = { kind: "layer" | "slot"; id: string; sx: number; sy: number; ox: number; oy: number };

export default function CardView({
  spec,
  texts,
  fit = "contain",
  paused,
  editor,
  unfold,
  inherit,
  preloaded,
  onReady,
}: {
  spec: CardSpec;
  texts: CardTexts;
  fit?: "contain" | "width";
  paused?: boolean;
  editor?: EditorApi;
  unfold?: boolean;
  inherit? : boolean;
  preloaded?: boolean;
  onReady?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const urls = useMemo(() => {
    const list = [spec.bg.src, ...spec.layers.map((l) => l.src)].filter((u): u is string => !!u);
    return Array.from(new Set(list));
  }, [spec.bg.src, spec.layers]);

  const { done : loaded , progress } =  useImagePreload(urls);
  const done = preloaded || loaded;

  useEffect(() => {
    if (done) onReady?.();
  }, [done, onReady]);

  const sizeStyle: React.CSSProperties =
    fit === "contain"
      ? { width: `min(100cqw, calc(100cqh * ${spec.aspect}))`, aspectRatio: String(spec.aspect) }
      : { width: "100%", aspectRatio: String(spec.aspect) };

  function wrap(node: React.ReactNode) {
    if (fit === "width") return node;
    return (
      <div style={{ width: "100%", height: "100%", containerType: "size", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {node}
      </div>
    );
  }

  if (!done) {
    return wrap(
      <div className="card-root card-skeleton" style={sizeStyle}>
        <div className="card-progress" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>,
    );
  }

  function pointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (inherit || editor || paused) return;
    const el = rootRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  }

  function pointerLeave() {
    const el = rootRef.current;
    if (inherit || !el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  }

  function down(e: React.PointerEvent<HTMLDivElement>, kind: "layer" | "slot", id: string, x: number, y: number) {
    if (!editor) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    editor.onSelect({ kind, id });
    dragRef.current = { kind, id, sx: e.clientX, sy: e.clientY, ox: x, oy: y };
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    const el = rootRef.current;
    if (!d || !editor || !el) return;
    const r = el.getBoundingClientRect();
    editor.onMove(
      d.kind,
      d.id,
      round(d.ox + ((e.clientX - d.sx) / r.width) * 100),
      round(d.oy + ((e.clientY - d.sy) / r.height) * 100),
    );
  }

  function up() {
    dragRef.current = null;
  }

  const outline = (kind: "layer" | "slot", id: string): React.CSSProperties =>
    editor?.selected?.kind === kind && editor.selected.id === id
      ? { outline: "2px dashed #38bdf8", outlineOffset: 2 }
      : {};

  return wrap(
    <div
      ref={rootRef}
      className={unfold ? "card-root card-unfold" : "card-root"}
      style={{
        ...sizeStyle,
        backgroundColor: spec.bg.color,
        backgroundImage: spec.bg.src ? `url("${encodeURI(spec.bg.src)}")` : undefined,
        ...(unfold
          ? ({ "--unfold-inset": `${((1 - Math.min(1, spec.aspect / 1.48)) / 2) * 100}%` } as React.CSSProperties)
          : {}),
      }}
      onPointerMove={pointerMove}
      onPointerLeave={pointerLeave}
      onPointerDown={() => editor?.onSelect(null)}
    >
      {unfold && <div className="card-veil" />}
      {spec.layers.map((l) => {
        const m = l.motion;
        const animated = !paused && !editor && m.kind !== "none";
        const parallax = !editor && l.parallax !== 0;
        return (
          <div
            key={l.id}
            onPointerDown={(e) => down(e, "layer", l.id, l.x, l.y)}
            onPointerMove={move}
            onPointerUp={up}
            style={{
              position: "absolute",
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.w}%`,
              transform: `translate(-50%, -50%) rotate(${l.rotate}deg)`,
              zIndex: l.z,
              pointerEvents: editor ? "auto" : "none",
              cursor: editor ? "grab" : undefined,
              touchAction: editor ? "none" : undefined,
              ...outline("layer", l.id),
            }}
          >
            <div
              style={
                parallax
                  ? {
                      transform: `translate(calc(var(--px, 0) * ${l.parallax} * 1cqw), calc(var(--py, 0) * ${l.parallax} * 1cqw))`,
                      transition: "transform 0.2s ease-out",
                    }
                  : undefined
              }
            >
              <div
                className={animated ? `card-anim card-m-${m.kind}` : undefined}
                style={
                  animated
                    ? ({ "--amt": m.amount, "--dur": `${m.duration}s`, "--delay": `${m.delay}s` } as React.CSSProperties)
                    : undefined
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.src}
                  alt=""
                  draggable={false}
                  style={{ display: "block", width: "100%", height: "auto", userSelect: "none" }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {spec.slots.map((s) => {
        const text = slotText(s.key, texts);
        if (!text && !editor) return null;
        return (
          <div
            key={s.key}
            className="card-slot"
            onPointerDown={(e) => down(e, "slot", s.key, s.x, s.y)}
            onPointerMove={move}
            onPointerUp={up}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.w}%`,
              transform: "translate(-50%, -50%)",
              textAlign: s.align,
              fontSize: `${s.size}cqw`,
              lineHeight: 1.15,
              color: s.color,
              fontFamily: FONTS[s.font],
              fontWeight: s.weight,
              textTransform: s.upper ? "uppercase" : "none",
              zIndex: s.z,
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
              pointerEvents: editor ? "auto" : "none",
              cursor: editor ? "grab" : undefined,
              touchAction: editor ? "none" : undefined,
              ...outline("slot", s.key),
            }}
          >
            {text || `[${s.key}]`}
          </div>
        );
      })}
    </div>,
  );
}
