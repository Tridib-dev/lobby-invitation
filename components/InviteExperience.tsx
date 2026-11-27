"use client";


import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { Design } from "@/src/lib/projectsClient";
import { accentHex, buildTheme } from "@/src/envelopes/design";
import { useCardSpec } from "@/features/card/useCardSpec";

import { formatWhen } from "@/src/cards/format";
import { useImagePreload } from "@/features/card/useImagePreload";
import { specUrls } from "@/src/cards/spec";
import { useAudioLoop } from "@/features/music/useLoopAudio";
import SoundToggle from "@/features/music/SoundToggle";



const Envelope3D = dynamic(() => import ("@/components/envelope3d/Envelope3d"), {
    ssr : false,
});


type Shown = {
    title : string;
    location?: string | null;
    hostName?: string | null;
    message?: string | null;
    startsAt: string ;
    design?: Design | null;
};


export default function InviteExperience({ invite , fill } : { invite : Shown ; fill?: boolean}) {
    const { title , location , message , hostName , startsAt , design } = invite;

    

    const theme = useMemo(() => buildTheme(design) , [design]);
    const accent = accentHex(design?.accent);
    const cardId = design?.cardLayout;
    const { spec } = useCardSpec(cardId);
    useImagePreload(spec ? specUrls(spec) : []);

    const when = useMemo(() => formatWhen(startsAt) , [startsAt]);

    const music= design?.music;
    const sound = useAudioLoop(music?.trackId , music?.start , music?.end);

    const letter = useMemo(
        () => ({
            guest : "Dear Guest",
            title,
            date : when,
            location : location ?? "",
            note : message ?? "",
            blank : !!spec,
        }),
        [title , location , message , when , spec],
    );

    const texts = useMemo(
        () => ({
            guest : "Dear guest",
            title,
            date : when,
            location : location ?? "",
            note : message ?? "",
            host : hostName ?? "",
        }),
        [title , when , location , message , hostName]
    )
    return (
        <div style={{ position: "relative", width: "100%", height: fill ? "100%" : undefined }}>
            <Envelope3D
                theme={theme}
                letter={letter}
                cardSpec={spec}
                cardTexts={texts}
                accent={accent}
                fill={fill}
                onOpenStart={() => sound.play()}
            />     
            {sound.ready && (
                <SoundToggle muted={sound.muted} appleUrl={sound.appleUrl} onToggle={sound.toggleMute} />
            )}       
        </div>
    );
}