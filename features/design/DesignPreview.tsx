"use client";

import { useMemo } from "react";
import InviteExperience from "@/components/InviteExperience";
import type { Draft } from "../wizard/types";
import { title } from "process";

const SAMPLE_DATE = "2026-12-05T13:00:00.000Z";

export default function DesignPreview({ draft } : { draft : Draft }) {
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

    return <InviteExperience invite={project} fill />
}