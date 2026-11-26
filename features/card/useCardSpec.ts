"use client";

import { useEffect , useState } from "react";
import type { CardSpec } from "@/src/cards/spec";

const cache = new Map<string,Promise<CardSpec | null >>();

export function loadCardSpec(id : string) : Promise<CardSpec | null> {
    let p = cache.get(id);

    if(!p) {
        p = fetch(`/cards/${encodeURIComponent(id)}/spec.json`)
            .then((r) => (r.ok ? (r.json() as Promise<CardSpec>) : null))
            .catch(() => null);
        cache.set(id, p );
    }
    return p;
}


type State = { id : string ; spec : CardSpec | null };

export function useCardSpec(id?: string) : { spec : CardSpec | null ; loading : boolean } {
    const [state , setState] = useState<State | null>(null);
    
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        loadCardSpec(id).then((spec) => {
            if(!cancelled) setState({ id , spec});
        });
        return () => {
            cancelled = true;
        };
    },[id]);

    if (!id) return { spec : null , loading : false };
    if (!state || state.id !== id) return { spec : null , loading : true };
    return {spec : state.spec , loading : false };
}