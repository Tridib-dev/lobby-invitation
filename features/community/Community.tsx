"use client";

import { useEffect , useState } from "react";
import ProjectCard from "./ProjectCard";

type Item = { 
    id : string;
    title : string;
    visibility : "public" | "private" ;
    manageAccess : "public" | "password";
}

export default function Community(){
    const [q , setQ ] = useState("");
    const [ debounced , setDebounced ] = useState("");
    const [ result , setResult ] = useState<{ q : string ; items : Item[] } | null>(null);
    const [ error , setError ] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(q.trim()) , 300);
        return () => clearTimeout(t);
    },[q]);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/projects?q=${encodeURIComponent(debounced)}`,{ cache : "no-store" })
            .then((r) => {
                if(!r.ok) throw new Error();
                return r.json();
            })
            .then((d) => {
                if (cancelled) return;
                setResult({ q : debounced , items : d.items });
            })
            .catch(() => {
                if(!cancelled) setError(true);
            });
        return () => {
            cancelled = true;
        };
    },[debounced]);

    const loading  = !result || result.q !== debounced;

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Community</h2>
            <input 
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title"
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/40"
            />
            {error && <p className="text-sm text-red-300">Couldn&apos;t load Projects. please refresh.</p>}
            {!error && loading && <p className="text-sm text-white/50">Loading...</p>}
            {!error && !loading && result.items.length === 0 && (
                <p className="text-sm text-white/50">No projects found.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
                {result?.items.map((p) => (
                    <ProjectCard key = {p.id} {...p} />
                ))}
            </div>
        </section>
    );
}