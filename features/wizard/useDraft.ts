"use client";

import { useEffect , useState } from "react";
import { EMPTY_DRAFT , type Draft } from "./types";


const KEY = "lobby:draft:v1";


export function useDraft(){
    const [draft , setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [ready , setReady] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if(raw) setDraft({ ...EMPTY_DRAFT, ...JSON.parse(raw), password : "" , managePassword : "" });
        }catch {}
        setReady(true);
    },[]);

    useEffect(() => {
        if (!ready) return;
        try {
            localStorage.setItem(KEY , JSON.stringify({ ...draft , password : "" , managePassword : ""}));
        } catch {}
    } , [draft,ready])
    
    const update = (patch : Partial<Draft>) => setDraft((d) => ({ ...d , ...patch }));
    const clear = () => {
        try {
            localStorage.removeItem(KEY);
        }catch{}
        setDraft(EMPTY_DRAFT);
    };

    return { draft , update , clear , ready };
}