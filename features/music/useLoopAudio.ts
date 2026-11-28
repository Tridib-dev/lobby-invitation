"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FADE_IN = 1.6; // seconds: music eases in instead of blasting
const FADE_OUT = 0.5; // seconds: stop and unmount ease out
const AHEAD_S = 40; // schedule this many seconds of looping in advance

// equal-power curves so a crossfade does not dip in volume
const makeCurve = (up: boolean) => {
  const c = new Float32Array(64);
  for (let i = 0; i < c.length; i++) {
    const t = i / (c.length - 1);
    c[i] = up ? Math.sin((t * Math.PI) / 2) : Math.cos((t * Math.PI) / 2);
  }
  return c;
};
const UP = makeCurve(true);
const DOWN = makeCurve(false);

interface Session {
  timer: number;
  gain: GainNode;
  sources: AudioBufferSourceNode[];
  starts: number[];
  len: number;
}

async function fetchAudio(url: string, trackId: number): Promise<ArrayBuffer> {
  try {
    const r = await fetch(url, { mode: "cors" });
    if (r.ok) return await r.arrayBuffer();
  } catch {
    // Apple's CDN sent no CORS headers: fall back to our own route
  }
  const r = await fetch(`/api/music/${trackId}/audio`);
  if (!r.ok) throw new Error("audio unavailable");
  return await r.arrayBuffer();
}

export function useAudioLoop(trackId?: number, start = 0, end = 30) {
  const ctxRef = useRef<AudioContext | null>(null);
  const outRef = useRef<GainNode | null>(null); // mute / unmute fades live here
  const bufRef = useRef<AudioBuffer | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const wantRef = useRef(false); // play() was tapped before the song finished loading
  const mutedRef = useRef(false);
  const rangeRef = useRef({ start, end });
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [appleUrl, setAppleUrl] = useState<string | null>(null);

  const halt = useCallback((fade: number) => {
    const ctx = ctxRef.current;
    const s = sessionRef.current;
    if (!ctx || !s) return;
    sessionRef.current = null;
    clearInterval(s.timer);
    const now = ctx.currentTime;
    s.gain.gain.cancelScheduledValues(now);
    s.gain.gain.setValueAtTime(s.gain.gain.value, now);
    s.gain.gain.linearRampToValueAtTime(0, now + fade);
    s.sources.forEach((src) => {
      try {
        src.stop(now + fade + 0.05);
      } catch {}
    });
  }, []);

  // starts a looping session: each pass overlaps the next by `x` seconds (crossfade)
  const begin = useCallback(
    (fadeIn: number) => {
      const ctx = ctxRef.current;
      const buf = bufRef.current;
      const out = outRef.current;
      if (!ctx || !buf || !out) return;
      halt(0.15);

      const lo = Math.max(0, Math.min(rangeRef.current.start, buf.duration - 1));
      const hi = Math.min(rangeRef.current.end, buf.duration);
      const len = Math.max(1, hi - lo);
      const x = Math.min(1.2, len / 3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeIn);
      gain.connect(out);

      const s: Session = { timer: 0, gain, sources: [], starts: [], len };
      let next = ctx.currentTime + 0.05;
      let first = true;

      const schedule = () => {
        while (next < ctx.currentTime + AHEAD_S) {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const g = ctx.createGain();
          g.gain.value = first ? 1 : 0;
          if (!first) g.gain.setValueCurveAtTime(UP, next, x);
          g.gain.setValueCurveAtTime(DOWN, next + len - x, x);
          src.connect(g);
          g.connect(gain);
          src.start(next, lo, len);
          src.onended = () => {
            s.sources = s.sources.filter((n) => n !== src);
          };
          s.sources.push(src);
          s.starts.push(next);
          first = false;
          next += len - x;
        }
        while (s.starts.length > 6 && s.starts[1] <= ctx.currentTime) s.starts.shift();
      };
      schedule();
      s.timer = window.setInterval(schedule, 1000);
      sessionRef.current = s;
    },
    [halt],
  );

  // create the audio context and load the song before the tap
  useEffect(() => {
    if (!trackId) return;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    let dead = false;
    const ctx = new AC();
    const out = ctx.createGain();
    out.gain.value = mutedRef.current ? 0 : 1;
    out.connect(ctx.destination);
    ctxRef.current = ctx;
    outRef.current = out;

    (async () => {
      try {
        const meta = await fetch(`/api/music/${trackId}`).then((r) => (r.ok ? r.json() : null));
        if (dead || !meta?.previewUrl) return;
        const data = await fetchAudio(meta.previewUrl, trackId);
        const buf = await ctx.decodeAudioData(data);
        if (dead) return;
        bufRef.current = buf;
        setAppleUrl(meta.appleUrl ?? null);
        setReady(true);
        if (wantRef.current) {
          begin(FADE_IN);
          setPlaying(true);
        }
      } catch {
        // stay silent: the invitation still works without music
      }
    })();

    return () => {
      dead = true;
      wantRef.current = false;
      const s = sessionRef.current;
      sessionRef.current = null;
      if (s) {
        clearInterval(s.timer);
        s.gain.gain.cancelScheduledValues(ctx.currentTime);
        s.gain.gain.setValueAtTime(s.gain.gain.value, ctx.currentTime);
        s.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      }
      window.setTimeout(() => ctx.close().catch(() => {}), 300);
      ctxRef.current = null;
      outRef.current = null;
      bufRef.current = null;
      setReady(false);
      setPlaying(false);
    };
  }, [trackId, begin]);

  // the loop range changed (picker sliders): restart the loop smoothly
  useEffect(() => {
    rangeRef.current = { start, end };
    if (sessionRef.current) begin(0.3);
  }, [start, end, begin]);

  const play = useCallback(() => {
    wantRef.current = true;
    ctxRef.current?.resume(); // must run inside the tap, or phones stay silent
    if (bufRef.current) {
      begin(FADE_IN);
      setPlaying(true);
    }
  }, [begin]);

  const stop = useCallback(() => {
    wantRef.current = false;
    halt(FADE_OUT);
    setPlaying(false);
  }, [halt]);

  const toggleMute = useCallback(() => {
    const ctx = ctxRef.current;
    const out = outRef.current;
    if (!ctx || !out) return;
    mutedRef.current = !mutedRef.current;
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(mutedRef.current ? 0 : 1, now + 0.35);
    setMuted(mutedRef.current);
  }, []);

  // 0 to 1: how far through the current loop pass we are (for the progress bar)
  const getProgress = useCallback(() => {
    const ctx = ctxRef.current;
    const s = sessionRef.current;
    if (!ctx || !s) return 0;
    const now = ctx.currentTime;
    let t = -1;
    for (const st of s.starts) {
      if (st <= now) t = st;
      else break;
    }
    return t < 0 ? 0 : Math.min(1, (now - t) / s.len);
  }, []);

  return { ready, playing, muted, appleUrl, play, stop, toggleMute, getProgress };
}