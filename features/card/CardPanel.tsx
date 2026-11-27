"use client";

import CardView from "./CardView";
import Foldcard from "./Foldcard";
import { useCardSpec } from "./useCardSpec";
import type { CardTexts } from "@/src/cards/spec";

export default function CardPanel ({
    id,
    texts,
    showStatus,
    fold,
} : {
    id?: string;
    texts : CardTexts;
    showStatus?: boolean;
    fold?: boolean;
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

    return fold ? <Foldcard spec={spec} texts={texts}/> : <CardView spec={spec} texts={texts} />
}