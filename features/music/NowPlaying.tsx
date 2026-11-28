/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import type { MusicPack } from "@/src/lib/music";
import styles from "./np.module.css";
import { Volume2, VolumeX } from "lucide-react";

export default function NowPlaying({
  music,
  muted,
  appleUrl,
  onToggleMute,
  getProgress,
}: {
  music: MusicPack;
  muted: boolean;
  appleUrl: string | null;
  onToggleMute: () => void;
  getProgress: () => number;
}) {
  const bar = useRef<HTMLDivElement>(null);

  // move the progress bar every frame without re-rendering React
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (bar.current) bar.current.style.width = `${getProgress() * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getProgress]);

  return (
    <div className={styles.root} role="region" aria-label="Now playing">
      <img className={styles.art} src={music.artwork} alt="" />
      <div className={styles.meta}>
        <div className={styles.eq} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} style={{ animationPlayState: muted ? "paused" : "running" }} />
          ))}
        </div>
        <div className={styles.title}>{music.name}</div>
        <div className={styles.artist}>{music.artist}</div>
        {appleUrl && (
          <a className={styles.link} href={appleUrl} target="_blank" rel="noreferrer">
            Listen on Apple Music
          </a>
        )}
      </div>
      <button
        type="button"
        className={styles.btn}
        onClick={onToggleMute}
        aria-label={muted ? "Unmute music" : "Mute music"}
        aria-pressed={muted}
      >
        {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>
      <div className={styles.bar}>
        <div ref={bar} />
      </div>
    </div>
  );
}