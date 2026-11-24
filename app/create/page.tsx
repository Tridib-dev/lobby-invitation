"use client";

import { useState } from "react";
import WizardShell, { StepDef } from "@/features/wizard/WizardShell";
import StepEvent from "@/features/wizard/StepEvent";
import StepHost from "@/features/wizard/StepHost";
import { useDraft } from "@/features/wizard/useDraft";
import { managePassword, validateStep } from "@/features/wizard/types";
import StepAccess from "@/features/wizard/stepAccess";
import ResultScreen from "@/features/wizard/ResultScreen";
import { createProject } from "@/src/lib/projectsClient";
import { saveMine } from "@/src/lib/myProjects";



const STEPS : StepDef[] = [
    {id : "event" , label : "Event"},
    {id : "host" , label : "Host"},
    {id : "access" , label : "Access"},
];


type Created = { 
    id : string ; 
    title : string ; 
    viewingProtected : boolean ;
    controlProtected : boolean ;
}

export default function CreatePage(){
    const { draft , update , clear , ready } = useDraft();
    const [ index , setIndex ] = useState(0);
    const [ busy , setBusy ] = useState(false);
    const [ submitError , setSubmitError ] = useState<string | null>(null);
    const [ created , setCreated ] = useState<Created | null > (null);


    if(!ready) return <main className="min-h-screen bg-neutral-900" />;

    if(created) {
        return (
            <ResultScreen
                {...created}
                onAnother={() => {
                    setCreated(null);
                    setIndex(0);
                }}
            />             
        );
    }

    const step  = STEPS[index];
    const error  = validateStep(step.id, draft);
    const last = index === STEPS.length - 1;


    async function Submit() {
        if(busy) return;
        setBusy(true);
        setSubmitError(null);
        try {
            const { id } = await createProject({
                title : draft.title.trim(),
                startsAt : new Date(draft.startsAtLocal).toISOString(),
                location : draft.location.trim(),
                hostName : draft.hostName.trim(),
                message : draft.message.trim(),
                design : draft.design,
                visibility : draft.visibility,
                password : draft.visibility === "private" ? draft.password : undefined,
                manageAccess : draft.manageAccess,
                managePassword : managePassword(draft)
            });
            saveMine({
                id,
                title : draft.title.trim(),
                visibility : draft.visibility,
                manageAccess : draft.manageAccess,
                createdAt : new Date().toISOString(),
            })
            setCreated({
                id,
                title : draft.title.trim(),
                viewingProtected : draft.visibility === "private",
                controlProtected : draft.manageAccess === "password",
            });
            clear();
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : "Couldn't Create the Inviatation");
        } finally {
            setBusy(false);
        }
    }

    return (
        <WizardShell
            steps = {STEPS}
            index = {index}
            onBack = {() => setIndex((i) => Math.max(0, i - 1 ))}
            onNext={last ? Submit : () => setIndex((i) => Math.min(STEPS.length-1,i+1))}
            nextLabel = {last ? (busy ? "Creating..." : "Create invitation") : "Next"}
            nextDisabled = { !!error || busy }
            hint = {error ?? submitError}
        >
            {step.id === "event" && <StepEvent draft={draft} update={update} /> }
            {step.id === "host" && <StepHost draft={draft} update={update} /> }
            {step.id === "access" &&  <StepAccess draft={draft} update={update} />}
        </WizardShell>
    );
}