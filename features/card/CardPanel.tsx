"use client";

import CardView from "./CardView";
import { useCardSpec } from "./useCardSpec";
import type { CardTexts } from "@/src/cards/spec";

export default function CardPanel ({
    id,
    texts,
    showStatus,
    unfold,
} : {
    id?: string;
    texts : CardTexts;
    showStatus?: boolean;
    unfold ?: boolean;
}) {
    const { spec , loading } = useCardSpec(id);

    if(!spec) {
        if(!showStatus) return null;
        const msg = !id ? "Pick a Card Below." : loading ? "Loading card..." : "This Card template was not found.";
        return (
            <div style={{ display : "flex" , height : "100%" , alignItems : "center" , justifyContent : "center" , color : "rgba(255,255,255,0.6)" , fontSize : 14 }}>
                {msg}
            </div>
        );
    }

    return <CardView spec={spec} texts={texts}  unfold={unfold}/>
}