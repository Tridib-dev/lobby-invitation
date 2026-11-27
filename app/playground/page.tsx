"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ENVELOPE_THEMES } from "@/src/envelopes/theme";

const Envelope3D = dynamic(() => import("@/components/envelope3d/Envelope3d"), { ssr: false });

const LETTER = {
  guest: "Tiyas",
  title: "Qawwaali Night",
  date: "Saturday, 5 December 2026 · 6:30 pm",
  location: "Durgapur",
  note: "Bring your voice and an empty stomach!",
};

export default function Playground() {
  const [themeId, setThemeId] = useState(ENVELOPE_THEMES[0].id);
  const [run, setRun] = useState(0);
  const theme = ENVELOPE_THEMES.find((t) => t.id === themeId) ?? ENVELOPE_THEMES[0];

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-neutral-900 p-8 text-white">
      <Envelope3D key={`${theme.id}-${run}`} theme={theme} letter={LETTER} cardTexts={{ ...LETTER , host : "" }} />
      <p className="text-sm text-white/60">Click the seal</p>
      <div className="flex flex-wrap justify-center gap-2">
        {ENVELOPE_THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setThemeId(t.id)}
            className={`rounded-full border px-4 py-2 text-sm ${t.id === themeId ? "bg-white text-black" : "border-white/30"}`}
          >
            {t.name}
          </button>
        ))}
        <button onClick={() => setRun((n) => n + 1)} className="rounded-full border border-white/30 px-4 py-2 text-sm">
          Replay
        </button>
      </div>
    </main>
  );
}