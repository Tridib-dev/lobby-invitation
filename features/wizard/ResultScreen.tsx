"use client";

import { useState } from "react";

export  default function ResultScreen({
    id,
    title,
    viewingProtected,
    controlProtected,
    onAnother,
} : {
    id :  string;
    title : string;
    viewingProtected : boolean;
    controlProtected : boolean;
    onAnother : () => void;
}) {
    const [ copied , setCopied ] = useState<"guest"|"control"|null>(null);

    const guestUrl = `${origin}/i/${id}`;
    const contorlUrl = `${origin}/edit/${id}`;

    async function Copy(text:string , which : "guest" | "control") {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(which);
            setTimeout(() => setCopied(null),1500)
        } catch {} 
    } 

    async function Share() {
        try{
            if (navigator.share) await  navigator.share({ title , url : guestUrl });
            else await Copy( guestUrl, "guest" );
        }catch {}
    }

    return (
        <main className=" min-h-screen bg-neutral-900 p-4 text-white">
            <div className="mx-auto w-full max-w-md space-y-6 py-10 text-center">
                <h1 className="text-2xl fonmt-semibold">Your invitation is ready</h1>
                <p className="text-white-70">{title}</p>

                <div className="space-y-1 rounded-xl bg-white/5 p-4 text-left text-sm">
                    <p>
                        <span className="text-white/50">Viewing : </span>
                        {viewingProtected ? "Password Protected" : "Public"}
                    </p>
                    <p>
                        <span className="text-white/50"> Control center : </span>
                        {controlProtected ? "Password protected" : "public (anyone can edit)"}
                    </p>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={Share}
                        className="w-full rounded-lg bg-white py-2.5 font-medium text-black"                    
                    >
                        Share invitation
                    </button>
                    
                    <button 
                        onClick={() => Copy(guestUrl,"guest")}
                        className="w-full rounded-lg bg-white/10 py-2.5 font-medium"                    
                    >
                        {copied === "guest" ? "Copied" : "Copy guest link"}
                    </button>
                    <button 
                        onClick={() => Copy(contorlUrl,"control")}
                        className="w-full rounded-lg bg-white/10 py-2.5 font-medium"                    
                    >
                        {copied === "control" ? "Copied" : "Copy control-center link"}
                    </button>
                    <a href={`/i/${id}`} className="blcok w-full rounded-lg bg-white/10 py-2.5 font-medium">
                        Open invitation
                    </a>
                </div>

                {( viewingProtected || controlProtected ) && (
                    <p className="text-sm text-amber-300">
                        Remember your password. There are no accounts, so we can&apos;t recover it.
                    </p>
                )}

                <button onClick={onAnother} className="text-sm text-white/60 underline">
                    Create another
                </button>
            </div>
        </main>
    );
}