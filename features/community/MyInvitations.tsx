"use client" ;

import { useEffect , useMemo , useState, useSyncExternalStore } from "react";
import { KEY , removeMine , type SavedProject } from "@/src/lib/myProjects";
import ProjectCard from "./ProjectCard";


function subscribe(cb : () => void) {
    window.addEventListener("storage" , cb);
    return () => window.removeEventListener("storage",cb);
}

function snapshot () {
    try {
        return localStorage.getItem(KEY);
    }catch{
        return null;
    }
}

export default function MyInvitations() {
    const raw = useSyncExternalStore(subscribe , snapshot , () => null);
    const [ gone , setGone ] = useState<string[]>([]);

    const items = useMemo<SavedProject[]>(() => {
        try {
            const v = raw ? JSON.parse(raw) : [];
            return Array.isArray(v) ? v : [];
        } catch {
            return [];
        }
    } , [raw]);

    useEffect (() => {
        if(items.length === 0) return;
        let cancelled = false;
        fetch(`/api/projects?ids=${items.map((p) => p.id).join(",")}`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d : { ids : string[] } | null ) => {
                if (cancelled || !d) return;
                const alive = new Set(d.ids);
                const missing = items.filter((p) => !alive.has(p.id)).map((p) => p.id);
                if(missing.length === 0) return;
                missing.forEach(removeMine);
                setGone((g) => [ ...g , ...missing]); 
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    },[items]);

    const shown = items.filter((p) => !gone.includes(p.id));
    if(shown.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">My invitations</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                {items.map((p) => (
                    <ProjectCard
                        key= {p.id}
                        id={p.id}
                        title={p.title}
                        visibility={p.visibility}
                        manageAccess={p.manageAccess}
                    />
               ))}
            </div>
        </section>
    );
}