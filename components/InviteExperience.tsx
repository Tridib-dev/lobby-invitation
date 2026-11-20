"use client";


import { useMemo } from "react";
import dynamic from "next/dynamic";
import  { getEnvelopeTheme } from "@/src/envelopes/theme";
import { InvitePayload } from "@/src/types/invite";


const Envelope3D = dynamic(() => import ("@/components/envelope3d/Envelope3d"), {
    ssr : false,
});



export default function InviteExperience ({ invite } : {invite : InvitePayload}) {

    const theme = getEnvelopeTheme("Ivory");

    const letter  = useMemo (
        () => ({
            guest : invite.guest,
            title : invite.title,
            date : new Date(invite.date).toLocaleString("en-IN", {
                dateStyle : "full",
                timeStyle : "short",
                timeZone : "Asia/Kolkata",
            }),
            location : invite.location,
            note : invite.note,
        }),
        [invite],
    );

    return <Envelope3D theme={theme} letter={letter} accent={invite.accent} />
}