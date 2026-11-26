"use client";

import { ACCENTS , SEALS } from "@/src/envelopes/design";
import { ENVELOPE_THEMES } from "@/src/envelopes/theme";
import type { Design } from "@/src/lib/projectsClient";
import type { Draft } from "./types";
import CardPicker from "../card/CardPicker";

function withDesign(d : Design , patch : Partial<Design>) : Design {
    const next = { ...d , ...patch } as Record<string , unknown>;
    for (const k of Object.keys(next)){
        if(next[k] === undefined) delete next[k];
    }
    return next as unknown as Design;
}

const pick = (on :boolean) => 
    `rounded-xl border p-2 text-left transition ${
    on ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"
}`;

export default function StepDesign({
    draft,
    update,
} : {
    draft : Draft;
    update : (patch : Partial<Draft>) => void;
}){
    const d = draft.design;
    const set = (patch : Partial<Design>) => update({ design : withDesign(d,patch) });

    return (
        <>

            <div className="space-y-2">
                <h2 className="font-medium text-white">Card</h2>
                <p className="text-xs text-whie/50">Shown after the envelope opens. Use the card tab tab in the preview.</p>
                <CardPicker value={d.cardLayout} onChange={(id) => set({ cardLayout : id })} />
            </div>
            <div className="space-y-2">
                <h2 className="font-medium text-white">Envelope</h2>
                <div className="grid grid-cols-2 gap-2">
                    {ENVELOPE_THEMES.map((t) => (
                        <button key={t.id} type="button" onClick={() => set({ theme : t.id})} className={pick(d.theme === t.id)}>
                            <span className="flex gap-1">
                                {[t.paper , t.flapPaper ?? t.paper , t.liner , t.seal.color].map((c,i) => (
                                    <span key={i} className="h-5 w-5 rounded-full border border-white/20" style={{ background : c }} />
                                ))}
                            </span>    
                            <span className="mt-1.5 block text-sm text-white">{t.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="font-medium text-white">Seal</div>
                <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => set({ seal : undefined })} className={pick(!d.seal)}>
                        <span className="text-sm text-white">Theme Default</span>
                    </button>
                    {SEALS.map((s) => (
                        <button key={s.id} type="button" onClick={() => set({ seal : s.id })} className={pick(d.seal === s.id)}>
                            <span className="block text-lg">{s.emblem === "sprig" ? "❦" : s.emblem}</span>
                            <span className="block text-sm text-white">{s.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="font-medium text-white">Accent colour</h2>
                <p className="text-xs text-white/50">
                    Colours the lines on the letter, and the seal on envelopes with a wax seal.
                </p>
                <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => set({ accent : undefined })} className={pick(!d.accent)}>
                        <span className="text-sm text-white">Default</span>
                    </button>
                    {ACCENTS.map((a) => (
                        <button key={a.id} type="button" onClick={() => set({ accent : a.id })} className={pick(d.accent === a.id)}>
                            <span className="block h-5 w-full rounded-md" style={{ background : a.hex }} />
                            <span className="mt-1 block text-sm text-white">{a.name}</span>
                        </button>
                    ))}
                </div>
            </div>
         </>
    );
}