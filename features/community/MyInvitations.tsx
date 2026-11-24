"use client" ;

import { useMemo , useSyncExternalStore } from "react";
import { KEY , type SavedProject } from "@/src/lib/myProjects";
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

    const items = useMemo<SavedProject[]>(() => {
        try {
            const v = raw ? JSON.parse(raw) : [];
            return Array.isArray(v) ? v : [];
        } catch {
            return [];
        }
    } , [raw]);

    if(items.length === 0) return null;

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