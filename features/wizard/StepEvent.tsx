"use client";

import { LIMITS , type Draft } from "./types";
import { Field , inputclass } from "./WizardShell";


export default function StepEvent({
    draft,
    update,
} : {
    draft : Draft;
    update : (patch : Partial<Draft>) => void;
}) {
    return (
        <>
            <Field label="Event title" hint={`${draft.title.length}/${LIMITS.title}`}>
                <input
                    className={inputclass}
                    value={draft.title}
                    maxLength = {LIMITS.title}
                    onChange={(e) => update({title : e.target.value })}
                    placeholder="Qawwalli Night"
                />
            </Field>
            <Field label="Date and Time" hint="In your own time zone.">
                <input
                    type="datetime-local"
                    className={inputclass}
                    value={draft.startsAtLocal}
                    onChange={(e) => update({startsAtLocal : e.target.value })}
                />
            </Field>
            <Field label="Location (optional)">
                <input
                    className={inputclass}
                    value={draft.location}
                    maxLength = {LIMITS.location}
                    onChange={(e) => update({location : e.target.value })}
                    placeholder="Mumbai"
                />
            </Field>
        </>
    );
}