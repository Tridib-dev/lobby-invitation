"use client";

import { useState } from "react";
import Envelope from "@/components/envelope/Envelope";
import { ENVELOPE_THEMES  } from "@/src/envelopes/theme";

export default function Playground() {
  const [themeId, setThemeId] = useState(ENVELOPE_THEMES[0].id);
  const [run, setRun] = useState(0);
  const theme = ENVELOPE_THEMES.find((t) => t.id === themeId) ?? ENVELOPE_THEMES[0];

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-neutral-900 p-8 pt-40 text-white">
      <Envelope key={`${theme.id}-${run}`} theme={theme}>
        <div className="flex h-full flex-col items-center justify-center p-4 text-center text-neutral-900">
          <p className="text-[10px] uppercase tracking-[0.3em]">You&apos;re invited</p>
          <h2 className="my-2 font-serif text-2xl">Qawwaali Night</h2>
          <p className="text-xs">Saturday, 5 December 2026 · 6:30 pm</p>
          <p className="text-xs">Durgapur</p>
        </div>
      </Envelope>

      <div className="mt-16 flex flex-wrap justify-center gap-2">
        {ENVELOPE_THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setThemeId(t.id)}
            className={`rounded-full border px-4 py-2 text-sm ${
              t.id === themeId ? "bg-white text-black" : "border-white/30"
            }`}
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