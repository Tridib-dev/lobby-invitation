"use client";


import { useState } from "react";
import InviteExperience from "./InviteExperience";
import type { ProjectView } from "@/src/lib/projectsClient";


export default function InviteGate({id , initial} : {id : string , initial : ProjectView}) {
    const [project , setProject] = useState<ProjectView>(initial);
    const [password, setPassword] = useState("");
    const [error , setError] = useState("");
    const [busy , setBusy] = useState(false);

    async function unlock(e:React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try{
            const res = await fetch(`/api/projects/${id}`, { 
                headers : { "x-password" : password },
                cache : "no-store",
            })
            const data = await res.json();
            if (res.ok && !data.locked ) setProject(data);
            else setError("That password isn't correct.");
            
        } catch {
            setError("Couldn't reach the server . Try again.");
        } finally {
            setBusy(false);
        } 
    }

    if(!project.locked) return (
        <main className="h-dvh w-full bg-neutral-900">
            <InviteExperience invite={project} fill />
        </main>
    );
    return (
        <main className="flex min-h-screen items-center justify-center bg-neutral-900 p-6 text-white">
            <form onSubmit={unlock} className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white/5 p-6">
                <h1 className="text-lg font-semibold">This invitation is password protected 🔒 </h1>
                <p className="text-sm text-white/60"> Enter the password you set earlier while creating , to open it</p>
                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoFocus
                    className="rounded-lg bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/40"
                />
                {error && <p className="text-sm text-red-300">{error}</p>}
                <button
                    type='submit'
                    disabled={busy || !password}
                    className="rounded-lg bg-white px-3 py-2 font-medium text-black disabled:opacity-50"
                >
                    {busy ? "Checking..." : "Open Invitation"}
                </button>
            </form>
        </main>
    );
}