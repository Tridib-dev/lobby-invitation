"use client";

import { useEffect , useState } from "react";
import StepEvent from "../wizard/StepEvent";
import StepHost from "../wizard/StepHost";
import StepAccess from "../wizard/StepAccess";
import { inputclass } from "../wizard/WizardShell";
import { EMPTY_DRAFT , managePassword , validateStep , type Draft } from "../wizard/types";
import { removeMine } from "@/src/lib/myProjects";
import type { Design } from "@/src/lib/projectsClient";


type Details = {
    id : string;
    title : string;
    location : string;
    hostName : string;
    message : string;
    startsAt : string;
    design : Design;
    visibility : "public" | "private";
    manageAccess : "public" | "password";
}

type Phase = "loading" | "notfound" | "error" | "locked" | "open" | "deleted" ;

const pad = (n : number) => String(n).padStart(2,"0");

function toLocalInput(iso : string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; 
}

function toDraft(p : Details) : Draft {
    return {
        ...EMPTY_DRAFT,
        title : p.title,
        startsAtLocal : toLocalInput(p.startsAt),
        location : p.location ?? "",
        hostName : p.hostName ?? "",
        message : p.message ?? "",
        visibility : p.visibility,   
        manageAccess : p.manageAccess,
        samePassword : true,
        design : p.design,     
    };
}

function manageHeaders(pw : string): Record<string ,string> {
    return pw ? {"x-password" : pw} : {};
}

export default function ControlCenter({ id } : { id : string }) {
    const [ phase , setPhase ] = useState<Phase>("loading");
    const [ draft , setDraft ] = useState<Draft>(EMPTY_DRAFT);
    const [ pw , setPw ] = useState("");
    const [ gatePw , setGatePw ] = useState("");
    const [ gateErr , setGateErr ] = useState("");
    const [ busy , setBusy ] = useState(false);
    const [ msg , setMsg ] = useState<{ ok : boolean ; text : string } | null>(null);
    const [ confirmDelete , setConfirmDelete ] = useState(false);
    const [copied , setCopied ] = useState<"guest" | "control" | null>(null);

    const update = ( patch : Partial<Draft>) => setDraft((d) =>({ ...d , ...patch })) ;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/projects/${encodeURIComponent(id)}/manage` , { cache : "no-store" });
                if (cancelled) return;
                if (res.status === 404) {
                    setPhase("notfound");
                    return;
                }

                const data = await res.json();
                if(data.locked) {
                    setPhase("locked");
                }else {
                    setDraft(toDraft(data));
                    setPhase("open");
                }
            } catch {
                if (!cancelled) setPhase("error");
            }
        })();
        return () => {
            cancelled = true;
        };
    } , [id]);


    async function unlock(e : React.FormEvent) {
        e.preventDefault();
        if(!gatePw || busy) return;
        setBusy(true);
        setGateErr("");
        try{
            const res = await fetch(`/api/projects/${encodeURIComponent(id)}/manage` , {
                headers : { "x-password" : gatePw },
                cache : "no-store",
            });
            if(res.status === 401) {
                setGateErr("That password isn't correct");
            } else if(!res.ok) {
                setGateErr("Something went wrong. Please try again.");
            } else {
                const data = await res.json();
                setDraft(toDraft(data));
                setPw(gatePw);
                setGatePw("");
                setPhase("open");
            }
        } catch {
            setGateErr("Network Problem. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    async function save() {
        if(busy) return;
        setBusy(true);
        setMsg(null);
        try{
            const res = await fetch(`/api/projects/${encodeURIComponent(id)}`,{
                method : "PATCH",
                headers : {"Content-Type" : "application/json" , ...manageHeaders(pw) },
                body : JSON.stringify({
                    title : draft.title.trim(),
                    startsAt : new Date(draft.startsAtLocal).toISOString(),
                    location : draft.location.trim(),
                    hostName : draft.hostName.trim(),
                    message : draft.message.trim(),
                    design : draft.design,
                    visibility : draft.visibility,
                    password : draft.password || undefined,
                    manageAccess : draft.manageAccess,
                    managePassword : managePassword(draft) || undefined, 
                }),
            });
            const data = await res.json().catch(() => ({}));
            if(!res.ok) throw new Error(data.error ?? "Couldn't save");
            if (draft.manageAccess === "public") {
                setPw("");
            } else {
                const next =  managePassword(draft);
                if(next) setPw(next);
            }
            update({ password : "" , managePassword : ""});
            setMsg({ ok : true , text : "Saved."});
        } catch(e) {
            setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not save" });
        } finally {
            setBusy(false);
        }
    }


    async function remove() {
        if (busy) return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
                method : "DELETE",
                headers : manageHeaders(pw),
            });
            const data = await res.json().catch(() => ({}));
            
            if (!res.ok) throw new Error(data.error ?? "Could not delete");
            removeMine(id);
            setPhase("deleted");
        } catch (e) {
            setMsg({ ok : false , text : e instanceof Error ? e.message : "Couldn't delete" });
            setConfirmDelete(false);
        } finally {
            setBusy(false);
        }
    }

    async function copy(path: string , which : "guest" | "control") {
        try{
            await navigator.clipboard.writeText(`${window.location.origin}${path}`);
            setCopied(which);
            setTimeout(() => setCopied(null) , 1500);
        } catch {}
    }

    const shell = ( children: React.ReactNode ) => (
        <main className="min-h-screen bg-neutral-900 p-4 text-white">
            <div className="mx-auto w-full max-w-md space-y-6 py-8">{children}</div>
        </main>
    );

    if (phase === "loading") return shell(<p className="text-white/60">Loading...</p>);
    if (phase === "notfound") return shell(<p>This invitation doesn&apos;t exist or was deleted.</p>);
    if(phase === "error") return shell(<p>Couldn&apos;t load this project. Please refreesh.</p>);

    if(phase === "deleted") {
        return shell(
            <>
                <p>This invitation was deleted.</p>   
                <a href="/create" className="block rounded-lg bg-white py-2.5 text-center font-medium text-black">
                    Create a new one
                </a>
            </>,
        );
    }
    if(phase === "locked") {
        return shell(
            <form onSubmit={unlock} className="space-y-4 rounded-2xl bg-white/5 p-6">
                <h1 className="text-xl font-semibold">Control center</h1>
                <p className="text-sm text-white/70">Enter the control center password to manage this project.</p>
                <input 
                    type="password"
                    value={gatePw}
                    onChange={(e) => setGatePw(e.target.value)}
                    autoFocus
                    className={inputclass}
                    placeholder="Password"
                />
                {gateErr && <p className="text-sm text-red-300">{gateErr}</p>}
                <button
                    type="submit"
                    disabled={busy || !gatePw}
                    className="w-full rounded-lg bg-white py-2 font-medium text-black disabled:opacity-50"
                >
                    {busy ? "Checking..." : "Open control center"}
                </button>
            </form>,
        );
    }

    const eventError = validateStep("event",draft);

    return shell(
        <>
            <header className="space-y-1">
                <p className="text-sm text-white/60">Control center</p>
                <h1 className="text-2xl font-semibold">{draft.title || "Untitled"}</h1>
            </header>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <a 
                    href={`/i/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white py-2 text-center font-medium text-black"
                >
                   Preview 
                </a>
                <button
                    onClick={() => copy(`/i/${id}` , "guest")} 
                    className="rounded-lg bg-white/10 py-2 font-medium"
                >
                    {copied === "guest" ? "Copied!" : "Copy guest link"}
                </button>
                <button
                    onClick={() => copy(`/edit/${id}`, "control")}
                    className="rounded-lg bg-white/10 py-2 font-medium"
                >
                    {copied === "control" ? "Copied!" : "Copy control link"}
                </button>
            </div>
            <section className="space-y-5">
                <h2 className="text-lg font-semibold">Event</h2>
                <StepEvent draft={draft} update={update} />
                <StepHost draft={draft} update={update} />
            </section>
            <section className="space-y-5">
                <h2 className="text-lg font-semibold">Access</h2>
                <p className="text-sm text-white">
                    Leave the password fields empty to keep the current passwords
                </p>
                <StepAccess draft={draft} update={update} />
            </section>
            {eventError && <p className="text-sm text-amber-300">{eventError}</p>}
            {msg && <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}

            <button
                onClick={save}
                disabled={busy || !!eventError}
                className="w-full rounded-lg bg-white py-2.5 font-medium text-black disabled:opacity-40"
            >
                {busy ? "Saving..." : "Save Changes"}
            </button>

            <section className="space-y-3 rounded-xl border border-red-400/30 p-4" >
                <h2 className="font-semibold text-red-300">Delete this invitation</h2>
                {!confirmDelete ? (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full rounded-lg bg-red-500/70 py-2 font-medium text-red-200"
                    >
                        Delete
                    </button> 
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg bg-white/10 py-2">
                            Cancel
                        </button>
                        <button onClick={remove} disabled={busy} className="flex-1 rounded-lg bg-red-500 py-2 font-medium disabled:opacity-50">
                            Yes, Delete forever                            
                        </button>
                    </div>
                )}
            </section>
        </>,
    );
}