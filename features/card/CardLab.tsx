"use client";

import { useEffect, useState, type ReactNode } from "react";
import CardView, { type Selection } from "./CardView";
import {
  ASPECTS,
  buildDefaultSpec,
  mergeFiles,
  nextLayerId,
  type CardLayer,
  type CardSlot,
  type CardSpec,
  type CardTexts,
  type MotionKind,
  type SlotKey,
} from "@/src/cards/spec";

const SAMPLE: CardTexts = {
  guest: "Dear Guest",
  title: "Tridib weds Tiyas",
  date: "Thursday, 10 December 2026 at 5:00 pm",
  location: "Hayatt, Salt Lake, Kolkata",
  note: "We would be honoured by your presence.",
  host: "the families",
};

const MOTIONS: MotionKind[] = ["none", "drift", "float", "sway", "pulse", "rotate"];

const box = "w-full rounded bg-white/10 px-2 py-1 text-sm text-white outline-none";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-white/70">{label}</span>
      <span className="w-40">{children}</span>
    </label>
  );
}

function Range({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <span className="w-10 text-right text-xs text-white/60">{value}</span>
    </span>
  );
}

export default function CardLab({ id }: { id: string }) {
  const [spec, setSpec] = useState<CardSpec | null>(null);
  const [error, setError] = useState("");
  const [sel, setSel] = useState<Selection>(null);
  const [play, setPlay] = useState(false);
  const [texts, setTexts] = useState<CardTexts>(SAMPLE);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dev/cards?t=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { spec: CardSpec | null; files: string[]; error?: string }) => {
        if (cancelled) return;
        if (d.error) {
          setError(d.error);
          return;
        }
        setSpec(d.spec ? mergeFiles(d.spec, d.files) : buildDefaultSpec(id, d.files));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the template.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <main className="min-h-screen bg-neutral-900 p-6 text-red-300">{error}</main>;
  if (!spec) return <main className="min-h-screen bg-neutral-900 p-6 text-white/60">Loading…</main>;

  const patchSpec = (p: Partial<CardSpec>) => setSpec((s) => (s ? { ...s, ...p } : s));
  const patchLayer = (lid: string, p: Partial<CardLayer>) =>
    setSpec((s) => (s ? { ...s, layers: s.layers.map((l) => (l.id === lid ? { ...l, ...p } : l)) } : s));
  const patchSlot = (key: string, p: Partial<CardSlot>) =>
    setSpec((s) => (s ? { ...s, slots: s.slots.map((x) => (x.key === key ? { ...x, ...p } : x)) } : s));

  const layer = sel?.kind === "layer" ? spec.layers.find((l) => l.id === sel.id) : undefined;
  const slot = sel?.kind === "slot" ? spec.slots.find((s) => s.key === sel.id) : undefined;

  async function save() {
    setStatus("Saving…");
    try {
      const res = await fetch(`/api/dev/cards?t=${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify(spec),
      });
      const d = await res.json().catch(() => ({}));
      setStatus(res.ok ? "Saved to public/cards/" + id + "/spec.json" : (d.error ?? "Save failed"));
    } catch {
      setStatus("Save failed");
    }
  }

  function duplicate() {
    if (!layer) return;
    const newId = nextLayerId(spec!.layers);
    setSpec((s) =>
      s
        ? {
            ...s,
            layers: [
              ...s.layers,
              { ...layer, id: newId, x: Math.min(95, layer.x + 6), y: Math.min(95, layer.y + 6), z: layer.z + 1 },
            ],
          }
        : s,
    );
    setSel({ kind: "layer", id: newId });
  }

  function removeLayer() {
    if (!layer) return;
    setSpec((s) => (s ? { ...s, layers: s.layers.filter((l) => l.id !== layer.id) } : s));
    setSel(null);
  }

  const editor = {
    selected: sel,
    onSelect: setSel,
    onMove: (kind: "layer" | "slot", sid: string, x: number, y: number) =>
      kind === "layer" ? patchLayer(sid, { x, y }) : patchSlot(sid as SlotKey, { x, y }),
  };

  return (
    <main className="min-h-screen bg-neutral-900 p-4 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-auto text-xl font-semibold">Card lab · {id}</h1>
            <button
              onClick={() => setPlay(false)}
              className={`rounded px-3 py-1.5 text-sm ${!play ? "bg-white text-black" : "bg-white/10"}`}
            >
              Edit
            </button>
            <button
              onClick={() => {
                setPlay(true);
                setSel(null);
              }}
              className={`rounded px-3 py-1.5 text-sm ${play ? "bg-white text-black" : "bg-white/10"}`}
            >
              Play
            </button>
            <button onClick={save} className="rounded bg-emerald-400 px-3 py-1.5 text-sm font-medium text-black">
              Save
            </button>
          </div>
          {status && <p className="text-sm text-white/60">{status}</p>}
          <div className="h-[72vh] rounded-2xl bg-black/40 p-3">
            <CardView spec={spec} texts={texts} editor={play ? undefined : editor} />
          </div>
        </section>

        <aside className="space-y-5">
          <div className="space-y-2 rounded-xl bg-white/5 p-3">
            <h2 className="font-medium">Card</h2>
            <Row label="Name">
              <input className={box} value={spec.name} onChange={(e) => patchSpec({ name: e.target.value })} />
            </Row>
            <Row label="Genre">
              <input className={box} value={spec.genre} onChange={(e) => patchSpec({ genre: e.target.value })} />
            </Row>
            <Row label="Shape">
              <select
                className={box}
                value={spec.aspect}
                onChange={(e) => patchSpec({ aspect: Number(e.target.value) })}
              >
                {ASPECTS.map((a) => (
                  <option key={a.value} value={a.value} className="text-black">
                    {a.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Background">
              <input
                type="color"
                className="h-7 w-full"
                value={spec.bg.color}
                onChange={(e) => patchSpec({ bg: { ...spec.bg, color: e.target.value } })}
              />
            </Row>
          </div>

          <div className="space-y-2 rounded-xl bg-white/5 p-3">
            <h2 className="font-medium">Layers (top first)</h2>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {[...spec.layers]
                .sort((a, b) => b.z - a.z)
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSel({ kind: "layer", id: l.id })}
                    className={`block w-full truncate rounded px-2 py-1 text-left text-sm ${
                      sel?.kind === "layer" && sel.id === l.id ? "bg-sky-500/30" : "bg-white/5"
                    }`}
                  >
                    {l.id} · {l.src.split("/").pop()}
                  </button>
                ))}
            </div>
            <h2 className="pt-2 font-medium">Text</h2>
            <div className="flex flex-wrap gap-1">
              {spec.slots.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSel({ kind: "slot", id: s.key })}
                  className={`rounded px-2 py-1 text-sm ${
                    sel?.kind === "slot" && sel.id === s.key ? "bg-sky-500/30" : "bg-white/5"
                  }`}
                >
                  {s.key}
                </button>
              ))}
            </div>
          </div>

          {layer && (
            <div className="space-y-2 rounded-xl bg-white/5 p-3">
              <h2 className="font-medium">Layer {layer.id}</h2>
              <Row label="Size">
                <Range value={layer.w} min={2} max={150} step={0.5} onChange={(w) => patchLayer(layer.id, { w })} />
              </Row>
              <Row label="Rotate">
                <Range value={layer.rotate} min={-180} max={180} step={1} onChange={(rotate) => patchLayer(layer.id, { rotate })} />
              </Row>
              <Row label="Order (z)">
                <input
                  type="number"
                  className={box}
                  value={layer.z}
                  onChange={(e) => patchLayer(layer.id, { z: Number(e.target.value) })}
                />
              </Row>
              <Row label="Motion">
                <select
                  className={box}
                  value={layer.motion.kind}
                  onChange={(e) => patchLayer(layer.id, { motion: { ...layer.motion, kind: e.target.value as MotionKind } })}
                >
                  {MOTIONS.map((m) => (
                    <option key={m} value={m} className="text-black">
                      {m}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Amount">
                <Range
                  value={layer.motion.amount}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(amount) => patchLayer(layer.id, { motion: { ...layer.motion, amount } })}
                />
              </Row>
              <Row label="Seconds">
                <Range
                  value={layer.motion.duration}
                  min={1}
                  max={40}
                  step={0.5}
                  onChange={(duration) => patchLayer(layer.id, { motion: { ...layer.motion, duration } })}
                />
              </Row>
              <Row label="Delay">
                <Range
                  value={layer.motion.delay}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={(delay) => patchLayer(layer.id, { motion: { ...layer.motion, delay } })}
                />
              </Row>
              <Row label="Parallax">
                <Range value={layer.parallax} min={0} max={6} step={0.5} onChange={(parallax) => patchLayer(layer.id, { parallax })} />
              </Row>
              <div className="flex gap-2 pt-1">
                <button onClick={duplicate} className="flex-1 rounded bg-white/10 py-1.5 text-sm">
                  Duplicate
                </button>
                <button onClick={removeLayer} className="flex-1 rounded bg-red-500/30 py-1.5 text-sm">
                  Remove
                </button>
              </div>
            </div>
          )}

          {slot && (
            <div className="space-y-2 rounded-xl bg-white/5 p-3">
              <h2 className="font-medium">Text: {slot.key}</h2>
              <Row label="Width">
                <Range value={slot.w} min={10} max={100} step={1} onChange={(w) => patchSlot(slot.key, { w })} />
              </Row>
              <Row label="Size">
                <Range value={slot.size} min={1.5} max={16} step={0.1} onChange={(size) => patchSlot(slot.key, { size })} />
              </Row>
              <Row label="Align">
                <select
                  className={box}
                  value={slot.align}
                  onChange={(e) => patchSlot(slot.key, { align: e.target.value as CardSlot["align"] })}
                >
                  {(["left", "center", "right"] as const).map((a) => (
                    <option key={a} value={a} className="text-black">
                      {a}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Font">
                <select
                  className={box}
                  value={slot.font}
                  onChange={(e) => patchSlot(slot.key, { font: e.target.value as CardSlot["font"] })}
                >
                  {(["serif", "script", "sans"] as const).map((f) => (
                    <option key={f} value={f} className="text-black">
                      {f}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Weight">
                <select
                  className={box}
                  value={slot.weight}
                  onChange={(e) => patchSlot(slot.key, { weight: Number(e.target.value) as CardSlot["weight"] })}
                >
                  {[400, 600, 700].map((w) => (
                    <option key={w} value={w} className="text-black">
                      {w}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Colour">
                <input
                  type="color"
                  className="h-7 w-full"
                  value={slot.color}
                  onChange={(e) => patchSlot(slot.key, { color: e.target.value })}
                />
              </Row>
              <Row label="UPPERCASE">
                <input
                  type="checkbox"
                  checked={slot.upper}
                  onChange={(e) => patchSlot(slot.key, { upper: e.target.checked })}
                />
              </Row>
            </div>
          )}

          <div className="space-y-2 rounded-xl bg-white/5 p-3">
            <h2 className="font-medium">Sample text (preview only)</h2>
            {(["title", "date", "location", "note", "host", "guest"] as const).map((k) => (
              <Row key={k} label={k}>
                <input className={box} value={texts[k] ?? ""} onChange={(e) => setTexts((t) => ({ ...t, [k]: e.target.value }))} />
              </Row>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
