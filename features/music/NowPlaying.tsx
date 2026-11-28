
"use client";

import { useEffect, useRef } from "react";
import type { MusicPack } from "@/src/lib/music";
import { Volume2, VolumeX } from "lucide-react";

const CSS = `
.lnp{position:fixed;top:max(12px,env(safe-area-inset-top));right:12px;z-index:60;
  width:min(calc(100vw - 24px),300px);display:flex;align-items:center;gap:10px;
  padding:8px 10px 11px 8px;border-radius:22px;overflow:hidden;color:#fff;
  background:linear-gradient(135deg,rgba(255,255,255,.24),rgba(255,255,255,.08));
  backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);
  border:1px solid rgba(255,255,255,.28);
  box-shadow:0 12px 32px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35);
  transform-origin:calc(100% - 30px) 30px;
  animation:lnp-pop .6s cubic-bezier(.2,1.15,.3,1) both}
@keyframes lnp-pop{from{opacity:0;transform:scale(.18)}60%{opacity:1}to{opacity:1;transform:scale(1)}}
@keyframes lnp-fade{from{opacity:0}to{opacity:1}}
.lnp-artwrap{position:relative;flex:none;animation:lnp-fade .35s .25s both}
.lnp-art{display:block;width:46px;height:46px;border-radius:12px;object-fit:cover;
  box-shadow:0 4px 12px rgba(0,0,0,.4)}
.lnp-eq{position:absolute;left:4px;bottom:4px;display:flex;align-items:flex-end;gap:2px;
  height:11px;padding:2px 3px;border-radius:5px;background:rgba(0,0,0,.45)}
.lnp-eq i{width:2px;height:100%;border-radius:1px;background:#fff;transform-origin:bottom;
  animation:lnp-eq 900ms ease-in-out infinite}
.lnp-eq i:nth-child(2){animation-delay:-.3s}
.lnp-eq i:nth-child(3){animation-delay:-.6s}
.lnp-eq i:nth-child(4){animation-delay:-.15s}
@keyframes lnp-eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.lnp-meta{min-width:0;flex:1;color:inherit;text-decoration:none;animation:lnp-fade .35s .25s both}
.lnp-title{font-size:14px;font-weight:600;line-height:1.25;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis;text-shadow:0 1px 8px rgba(0,0,0,.35)}
.lnp-artist{font-size:12px;line-height:1.3;opacity:.75;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.lnp-btn{flex:none;width:44px;height:44px;border-radius:50%;border:0;display:grid;place-items:center;
  cursor:pointer;background:#fff;color:#111;box-shadow:0 4px 14px rgba(0,0,0,.3);
  transition:transform .15s,background .25s,color .25s}
.lnp-btn[data-muted="true"]{background:rgba(255,255,255,.18);color:#fff;box-shadow:none}
.lnp-btn:hover{transform:scale(1.06)}
.lnp-btn:active{transform:scale(.92)}
.lnp-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.16)}
.lnp-bar>div{height:100%;width:0;background:#fff}
@media (prefers-reduced-motion:reduce){.lnp,.lnp-artwrap,.lnp-meta,.lnp-eq i{animation:none}}
`;

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



  
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (bar.current) bar.current.style.width = `${getProgress() * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getProgress]);

  const text = (
    <>
      <div className="lnp-title">{music.name}</div>
      <div className="lnp-artist">
        {music.artist}
        {appleUrl ? " · Apple Music" : ""}
      </div>
    </>
  );

  return (
    <div className="lnp" role="region" aria-label="Now playing">
      <style>{CSS}</style>
      <div className="lnp-artwrap">
        <img className="lnp-art" src={music.artwork} alt="" />
        <div className="lnp-eq" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} style={{ animationPlayState: muted ? "paused" : "running" }} />
          ))}
        </div>
      </div>

      {appleUrl ? (
        <a className="lnp-meta" href={appleUrl} target="_blank" rel="noreferrer">
          {text}
        </a>
      ) : (
        <div className="lnp-meta">{text}</div>
      )}

      <button
        type="button"
        className="lnp-btn"
        data-muted={muted}
        onClick={onToggleMute}
        aria-label={muted ? "Unmute music" : "Mute music"}
        aria-pressed={muted}
      >
        {muted ? <VolumeX size={22} /> : <Volume2 size={22} /> }
      </button>

      <div className="lnp-bar">
        <div ref={bar} />
      </div>
    </div>
  );
}