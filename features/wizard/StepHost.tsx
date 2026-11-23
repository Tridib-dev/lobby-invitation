"use client";

import { LIMITS, type Draft } from "./types";
import { Field , inputclass } from "./WizardShell";


export default function StepHost({
    draft ,
    update , 
} : {
    draft : Draft;
    update : (patch : Partial<Draft>) => void;
}) {
    return (
        <>
            <Field label="Hosted by (optional)">
                <input
                    className={inputclass}
                    value={draft.hostName}
                    maxLength={LIMITS.hostName}
                    onChange={(e) => update({hostName : e.target.value })}
                    placeholder="salman"
                />
            </Field>

            <Field label="Message for your guests (optional)" hint={`${draft.message.length}/${LIMITS.message}`}>
                <textarea 
                    className={`${inputclass} min-h-28`}
                    value={draft.message}
                    maxLength={LIMITS.message}
                    onChange={(e) => update({ message : e.target.value })}
                    placeholder="Bring your voice and an empty stomach!"
                />
            </Field>

        </>
    );
}