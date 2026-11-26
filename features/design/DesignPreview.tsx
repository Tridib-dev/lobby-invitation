"use client";

import { useMemo , useState } from "react";
import InviteExperience from "@/components/InviteExperience";
import type { Draft } from "../wizard/types";
import CardPanel from "../card/CardPanel";
import { formatWhen } from "@/src/cards/format";


const SAMPLE_DATE = "2026-12-05T13:00:00.000Z";

export default function DesignPreview({ draft } : { draft : Draft }) {
    const[ tab , steTab ] = useState<"envelope" | "card">("envelope")
    const startsAt = useMemo(() => {
        const t = Date.parse(draft.startsAtLocal);
        return Number.isNaN(t) ? SAMPLE_DATE : new Date(t).toISOString();
    },[draft.startsAtLocal])

    const project = useMemo(
        () => ({
            title : draft.title.trim() || "Your Event",
            location : draft.location,
            hostName : draft.hostName,
            message : draft.message,
            startsAt,
            design : draft.design,
        }),
        [draft.title , draft.location , draft.hostName , draft.message , startsAt , draft.design],
    );

    const texts = useMemo(
        () => ({
            guest : "Dear Guest",
            title : draft.title.trim() || "Your event",
            date : formatWhen(startsAt),
            location : draft.location,
            note : draft.message,
            host : draft.hostName,
        }),
        [draft.title , draft.location ,draft.message , draft.hostName , startsAt],
    );

    const tabClass = (on : boolean) => `rounded-full px-3 py-1 ${on ? "bg-white text-black" : "text-white"}`;

    return (
        <div style={{ position : "relative" , width : "100%" , height : "100%" }}>
            {tab === "envelope" ? (
                <InviteExperience invite={project} fill />    
            ) : (
                <CardPanel id={draft.design.cardLayout} texts={texts} showStatus />
            )}

            <div className="absolute left-3 top-3 z-20 flex gap-1 rounded-full bg-black/60 p-1 text-xs">
                <button type="button" onClick={() => steTab("envelope")} className={tabClass(tab === "envelope")}>
                    Envelope
                </button>
                <button type="button" onClick={() => steTab("card")} className={tabClass(tab === "card")} >
                    Card
                </button>
            </div>
        </div>
    );
}