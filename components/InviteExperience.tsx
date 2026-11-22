"use client";


import { useMemo } from "react";
import dynamic from "next/dynamic";
import  { getEnvelopeTheme } from "@/src/envelopes/theme";
import type { LetterContent } from "@/components/envelope3d/Envelope3d";
import type { Design } from "@/src/lib/projectsClient";

const Envelope3D = dynamic(() => import ("@/components/envelope3d/Envelope3d"), {
    ssr : false,
});


export interface InviteProject {
    title : string;
    location : string;
    hostName : string;
    message : string;
    startsAt : string;
    design : Design;
}

const IST = "Asia/Kolkata";

export default function InviteExperience ({ invite } : {invite : InviteProject}) {

    const theme = getEnvelopeTheme(invite.design.theme ?? "wedding");

    const letter  = useMemo<LetterContent>(
        () => {
            const d = new Date(invite.startsAt);
            const day = d.toLocaleDateString("en-IN" , { dateStyle : "full" , timeZone : IST});
            const time = d.toLocaleTimeString("en-IN" , { timeStyle : "short" , timeZone : IST});
            return {
                guest : "",
                title : invite.title,
                date : `${day} · ${time}`,
                location : invite.location,
                note : invite.message,
            };
        },[invite]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-900 p-4 text-white">
            <h1 className="sr-only">{invite.title}</h1>
            <Envelope3D theme={theme} letter={letter} />
            <p className="text-sm text-white/60"> Tap the seal to open 📤</p>
        </main>
    )
}