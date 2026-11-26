"use client";

import { useEffect, useState } from "react";

type State = { key: string; loaded: number; failed: number; timedOut: boolean };

export function useImagePreload(urls: string[], timeoutMs = 8000) {
  const key = urls.join("|");
  const [st, setSt] = useState<State>({ key: "", loaded: 0, failed: 0, timedOut: false });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let loaded = 0;
    let failed = 0;
    const push = () => {
      if (!cancelled) setSt({ key, loaded, failed, timedOut: false });
    };
    const imgs = key.split("|").map((url) => {
      const img = new Image();
      img.onload = () => {
        loaded += 1;
        push();
      };
      img.onerror = () => {
        failed += 1;
        push();
      };
      img.src = url;
      return img;
    });
    const timer = setTimeout(() => {
      if (!cancelled) setSt((s) => ({ ...s, key, timedOut: true }));
    }, timeoutMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      imgs.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [key, timeoutMs]);

  const cur = st.key === key ? st : { loaded: 0, failed: 0, timedOut: false };
  const total = urls.length;
  const settled = cur.loaded + cur.failed;
  const done = total === 0 || settled >= total || cur.timedOut;
  const progress = total === 0 ? 1 : Math.min(1, settled / total);
  return { done, progress, failed: cur.failed };
}
