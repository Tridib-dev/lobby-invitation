"use client";

import { button } from "motion/react-client";
import { Children, type ReactNode } from "react";

export type StepDef = { id : string ; label : string};

export function Field({ label , hint, children } : { label : string ; hint?: string ; children : ReactNode }) {
    return (
        <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">{label}</span>
            {children}
            {hint && <span className="block text-xs text-white/50">{hint}</span>}
        </label>
    );
}

export  const inputclass = "w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/40";


export default function WizardShell({
    steps,
    index,
    onBack,
    onNext,
    nextLabel = "Next",
    nextDisabled,
    hint,
    children,
} : {
    steps : StepDef[];
    index : number;
    onBack : () => void;
    onNext : () => void;
    nextLabel? : string;
    nextDisabled? : boolean;
    hint? : string | null;
    children : ReactNode
}) {
    return(
        <main className="min-h-screen bg-neutral-900 p-4 text-white">
            <div className="mx-auto w-full max-w-md space-y-6 py-6">
                <header className="space-y-3">
                    <p className="text-sm text-white/60">
                        Step {index + 1} of {steps.length} · {steps[index].label}
                    </p>
                    <div className="flex gap-1.5">
                        {steps.map((s,i) => (
                            <div
                                key={s.id}
                                className = {`h-1.5 flex-1 rounded-full ${i <= index ? "bg-white" : "bg-white/15"}`}
                            />
                        ))}
                    </div>
                </header>

                <section className="space-y-5">{children}</section>

                {hint && <p className="text-sm text-amber-300">{hint}</p>}

                <footer className="flex gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={index === 0}
                        className="flex-1 rounded-lg bg-white/10 py-2.5 font-medium disabled:opacity-30"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={nextDisabled}
                        className="flex-1 rounded-lg bg-white py-2.5 font-medium text-black disabled:opacity-40"
                    >
                        {nextLabel}
                    </button>
                </footer>
            </div>
        </main>
    );
}