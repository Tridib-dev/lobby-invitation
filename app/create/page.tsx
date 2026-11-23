"use client";

import { useState } from "react";
import WizardShell, { StepDef } from "@/features/wizard/WizardShell";
import StepEvent from "@/features/wizard/StepEvent";
import StepHost from "@/features/wizard/StepHost";
import { useDraft } from "@/features/wizard/useDraft";
import { validateStep } from "@/features/wizard/types";


const STEPS : StepDef[] = [
    {id : "event" , label : "Event"},
    {id : "host" , label : "Host"},
    {id : "access" , label : "Access"},
];

export default function CreatePage(){
    const { draft , update , ready } = useDraft();
    const [ index , setIndex ] = useState(0);

    if(!ready) return <main className="min-h-screen bg-neutral-900" />;

    const step  = STEPS[index];
    const error  = validateStep(step.id, draft);
    const last = index === STEPS.length - 1;

    return (
        <WizardShell
            steps = {STEPS}
            index = {index}
            onBack = {() => setIndex((i) => Math.max(0, i - 1 ))}
            onNext = {() => setIndex((i) => Math.min( STEPS.length - 1 , i + 1 ))}
            nextLabel = {last ? "Create(next step)" : "Next"}
            nextDisabled = { !!error || last }
            hint = {error}
        >
            {step.id === "event" && <StepEvent draft={draft} update={update} /> }
            {step.id === "host" && <StepHost draft={draft} update={update} /> }
            {step.id === "access" &&  (
                <p className="text-white/70">The Access step is coming in the next message.</p>
            )}
        </WizardShell>
    );
}