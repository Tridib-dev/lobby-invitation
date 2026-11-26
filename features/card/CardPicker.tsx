"use client";

import { filter } from "motion/react-client";
import { useEffect , useState } from "react";

type Entry = { 
    id : string;
    name : string; 
    genre : string; 
    aspect : number; 
    bg : string | null;
};

export default function CardPicker({
    value,
    onChange,
} : {
    value?: string;
    onChange : (id : string | undefined) => void;
}) {
    const [ items , setItems ] = useState<Entry[] | null>(null);
    
    useEffect(() => {
        let cancelled = false;
        fetch("/cards/index.json", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((d: { items?: Entry[] }) => {
                if (!cancelled) setItems(d.items ?? []);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            });
        return () => {
            cancelled = true;
        };
    },[]);

    if(!items) return <p className="tet-sm text-white/50"> Loading Cards...</p>;
    if(items.length === 0) return <p className="text-sm text-white/50"> No card templates yet.</p>
    
    const genres = Array.from(new Set(items.map((i) => i.genre)));
    const ring = (on : boolean) => (on ? "border-white" : "border-white/15 hover:border-white/40");

    return (
        <div className="space-y-4">
            <button type="button" onClick={() => onChange(undefined)} className={`w-full rounded-xl border p-2 text-left text-sm text-white ${ring(!value)}`}>
                Plain Letter (no collage card)
            </button>
            {genres.map((g) => (
                <div key={g} className="space-y-5">
                    <p className="text-xs uppercasetracking-wide text-white/50">{g}</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {items.filter((i) => i.genre === g).map((i) => (
                            <button
                                key={i.id}
                                type="button"
                                onClick={() => onChange(i.id)}
                                className={`w-24 shrink-0 rounded-xl border p-1.5 text-left ${ring(value === i.id)}`}
                            >
                                {i.bg ? (
                                    <img
                                        src={i.bg}
                                        alt=""
                                        draggable={false}
                                        className="w-full rounded-md object-cover"
                                        style = {{ aspectRatio : String(i.aspect) }}
                                    />
                                ) : (
                                    <div className="w-full rounded-md bg-white/10" style={{ aspectRatio : String(i.aspect) }} />
                                )}
                                <span className="mt-1 block truncate text-xs text-white">{i.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// dont evewn think to chnage the nesting or you may waste the precious 1-2 hrs time to fdebug bro .... frndlyy suggestion