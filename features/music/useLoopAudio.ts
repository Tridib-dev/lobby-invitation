"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioLoop( trackId?: number , start = 0 , end = 30) {
    const audioRef = useRef<HTMLAudioElement | null >(null);
    const [ready , setReady] = useState(false);
    const [playing , setPlaying] = useState(false);
    const [muted , setMuted] = useState(false);
    const [appleUrl , setAppleUrl] = useState<string | null>(null);

    useEffect(() => {
        if(!trackId) return;
        let dead = false;
        fetch(`/api/music/${trackId}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
            if(dead || !d?.previewUrl) return;
            const a = new Audio(d.previewUrl);
            a.preload = "auto";
            audioRef.current = a;
            setAppleUrl(d.appleUrl ?? null);
            setReady(true);
        }).catch(() => {});
        return () => {
            dead = true;
            audioRef.current?.pause();
            audioRef.current = null;
            setReady(false);
            setPlaying(false);
        };
    } , [trackId]);

    useEffect(() => {
        if(!playing) return;
        const timer = setInterval(() => {
            const a = audioRef.current;
            if(a && a.currentTime >= end - 0.05) a.currentTime = start;
        } , 60);
        return () => clearInterval(timer);
    },[playing,start , end]);

    const play = useCallback(() => {
        const a = audioRef.current;
        if(!a) return;
        if(a.readyState >= 1) a.currentTime = start;
        else a.addEventListener("loadedmetadata",() => (a.currentTime = start) , { once : true });
        a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    },[start]);

    const stop = useCallback(() => {
        audioRef.current?.pause();
        setPlaying(false);
    },[]);

    const toggleMute = useCallback(() => {
        const a = audioRef.current;
        if(!a) return;
        a.muted = !a.muted;
        setMuted(a.muted);
    },[]);

    return { ready , playing , muted , appleUrl , play , stop , toggleMute };
}