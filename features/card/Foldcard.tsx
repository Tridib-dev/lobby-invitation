"use client";

import"./card.css";
import { useRef } from "react";
import CardView from "./CardView";
import { useImagePreload } from "./useImagePreload";
import { specUrls , type CardSpec , type CardTexts } from "@/src/cards/spec";


export default function Foldcard({ 
    spec,
    texts,
} : {
    spec : CardSpec;
    texts : CardTexts;
}) {
    const stageRef = useRef<HTMLDivElement>(null);
    const { done } = useImagePreload(specUrls(spec));

    function move(e : React.PointerEvent<HTMLDivElement>) {
        const el = stageRef.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)   return;

        const r = el.getBoundingClientRect();
        el.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
        el.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
    }

    function leave() {
        const el = stageRef.current;
        if(!el) return;
        el.style.setProperty("--px","0");
        el.style.setProperty("--py","0");
    }

    if(!done) return null;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                containerType: "size",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                ref={stageRef}
                className="fold-stage"
                onPointerMove={move}
                onPointerLeave={leave}
                style={{
                    width: `min(100cqw, calc(100cqh * ${spec.aspect}))`,
                    aspectRatio: String(spec.aspect),
                }}
            >
                <div className="fold-sheet">
                    <div className="fold-sheet-bottom">
                        <CardView spec={spec} texts={texts} fit="width" inherit preloaded />
                    </div>

                    <div className="fold-hinge">
                        <div className="fold-hinge-front" />
                        <div className="fold-hinge-back" />
                    </div>
                </div>
            </div>
        </div>
    );
}