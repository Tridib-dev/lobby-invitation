"use client";


import { useMemo , useCallback , useState } from "react";
import dynamic from "next/dynamic";
import type { Design } from "@/src/lib/projectsClient";
import { accentHex, buildTheme } from "@/src/envelopes/design";
import { useCardSpec } from "@/features/card/useCardSpec";
import CardPanel from "@/features/card/CardPanel";
import { formatWhen } from "@/src/cards/format";



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

    const [ opened , setOpened ] = useState(false);
    const handleOpened = useCallback(() => setOpened(true) , []);

    const theme = useMemo(() => buildTheme(design) , [design]);
    const accent = accentHex(design?.accent);
    const cardId = design?.cardLayout;
    const { spec } = useCardSpec(cardId);

    const when = useMemo(() => formatWhen(startsAt) , [startsAt]);

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
                accent={accent}
                fill={fill}
                onOpened={handleOpened}
            />            
            {opened && spec && (
                <div
                    data-card-overlay="true"
                    style={{
                        position : "absolute",
                        inset : 0,
                        top : 0,
                        right : 0,
                        bottom : 0,
                        left : 0,
                        zIndex : 5,
                        padding : 12,
                        background : "rgba(0,0,0,0.75)",
                        animation : "card-fade-in 0.7s ease-out both",
                    }}
                    
                >
                    <CardPanel id={cardId} texts={texts} unfold />
                </div>
            )}
        </div>
    );
}