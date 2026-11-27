"use client";

import { MIN_LOOP, PREVIEW_SECONDS , type MusicPack } from "@/src/lib/music";
import { useEffect, useState } from "react";
import { useAudioLoop } from "./useLoopAudio";

interface Result {
    trackId: number;
    name : string;
    artist: string;
    artwork : string;
}

export default function MusicPicker({
    value,
    onChange,
} :{
    value?: MusicPack;
    onChange : (m?: MusicPack) => void;
}) {
    const [q , setQ] = useState("");
    const [results , setResults] = useState<Result[]>([]);
    const [busy , setBusy] = useState(false);
    const [error , setError] = useState("");
    const audio = useAudioLoop(value?.trackId,value?.start ?? 0,value?.end ?? PREVIEW_SECONDS);

    const active = q.trim().length >= 2;
    useEffect(() => {
        const term = q.trim();
        if(term.length < 2) {
            return;
        }
        const ctl = new AbortController();
        const timer = setTimeout(async () => {
            setBusy(true);
            setError("");
            try {
                const res = await fetch(`/api/music/search?q=${encodeURIComponent(term)}` , { signal : ctl.signal});
                const data = await res.json();
                
                if(!res.ok) throw new Error("Search failed");
                setResults(data.tracks ?? []);
            } catch (e) {
                if((e as Error).name !== "AbortError") setError("Couldnot search right now. Try again!");
            } finally{
                setBusy(false);
            }
        } , 350);
        return () => {
            clearTimeout(timer);
            ctl.abort();
        }
    },[q]);

    function choose(r : Result) {
        audio.stop();
        onChange({ trackId : r.trackId , name : r.name , artist : r.artist , artwork : r.artwork , start : 0 , end: PREVIEW_SECONDS});
        setResults([]);
        setQ("");
    }

    return (
        <div className="space-y-3">
            <h2 className="font-medium text-white">
                Music (Optional)
            </h2>
            <p className="text-xs text-white/50">Plays on a loop when your guest opens the envelope.</p>

            {value ? (
                <div className="space-y-3 rounded-xl border border-white/15 p-3">
                    <div className="flex items-center gap-3">
                        <img src={value.artwork} alt="" className="h-14 w-14 rounded-lg" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white">{value.name}</p>
                            <p className="truncate text-xs text-white/60">{value.artist}</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => {
                                audio.stop();
                                onChange(undefined);
                            }}
                            className="text-xs tetx-white/60 underline"
                        >
                            Remove
                        </button>
                    </div>
                    <label className="block text-xs text-white/70">
                        Loop starts at {value.start}s
                        <input 
                            type="range"
                            min={0}
                            max={value.end - MIN_LOOP}
                            value={value.start}
                            onChange={(e) => onChange({ ...value, start : Number(e.target.value) })}
                            className="w-full"
                        />
                    </label>
                    <label className="block text-xs text-white/70">
                        Loop ends at {value.end}s
                        <input
                            type="range"
                            min={value.start + MIN_LOOP}
                            max={PREVIEW_SECONDS}
                            value={value.end}
                            onChange={(e) => onChange({ ...value , end: Number(e.target.value) })}
                            className="w-full"
                        />
                    </label>

                    <button
                        type="button"
                        disabled={!audio.ready}
                        onClick={() => (audio.playing ? audio.stop() : audio.play())}
                        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
                    >
                        {audio.playing ? "Stop" : "Play highlight"}
                    </button>
                </div>
            ) : (
                <>
                    <input 
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search a song or artist"
                        className="w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
                    />
                    {active && busy && <p className="text-xs text-white/50">Searching...</p>}
                    {active && error && <p className="text-xs text-red-300" >{error}</p>}
                    <ul className="space-y-1">
                        {results.map((r) => (
                            <li key={r.trackId}>
                                <button 
                                    type="button"
                                    onClick={() => choose(r)}
                                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/10"
                                >
                                    <img src={r.artwork} alt="" className="h-10 w-10 rounded-md" />
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm text-white">{r.name}</span>
                                        <span className="blcok truncate text-xs text-white/60">{r.artist}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <p className="text-[11px] text-white/40">Song previews and artworks provided by Apple</p>
        </div>
    );
}