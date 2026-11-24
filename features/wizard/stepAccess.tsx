"use client";

import type { ReactNode } from "react";
import { Field , inputclass } from "./WizardShell";
import type { Draft } from "./types";



function Choice({ selected , disabled , title , desc , onClick  } : { 
    selected : boolean ; 
    disabled?: boolean ; 
    title : string ; 
    desc : ReactNode ; 
    onClick : () => void
}) {
    return (
        <button 
            type = "button"
            onClick={onClick}
            disabled={disabled}
            className = {`w-full rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 
                ${
                    selected ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"
                }
            `}
        >
            <span className="block font-medium text-white">{title}</span>
            <span className="mt-0.5 block text-sm text-white/60">{desc}</span>
        </button>
    );
}


export default function StepAccess({ draft , update } : {draft : Draft ; update : (patch : Partial<Draft>) => void;}) {
    const viewingPrivate = draft.visibility === "private";
    const controlPassword = draft.manageAccess === "password";
    const both = viewingPrivate && controlPassword;
    const oneField = both && draft.samePassword;

    return (
        <>
            <div className="space-y-2">
                <h2 className="font-medium text-white">Who can open the invitation ?</h2>
                <Choice
                    selected={!viewingPrivate}
                    title="public"
                    desc="Anyone with the link can open it."
                    onClick={() => update({ visibility : "public"})}
                />
                <Choice
                    selected={viewingPrivate}
                    title="Guests must enter password first."
                    desc="Guests must enter a password first."
                    onClick={() => update({ visibility : "private" ,manageAccess : "password"})}
                />
            </div>

            <div className="space-y-2">
                <h2 className="font-medium text-white">Who can Manage it ?</h2>
                <Choice
                    selected={!controlPassword}
                    disabled={viewingPrivate}
                    title="public"
                    desc={
                        viewingPrivate 
                        ? "Not available : A password-protected invitation needs a password-protected control panel because  the control center shows every detail."
                        : "Anyone can read , edit and delete this project . No Password !"
                    }
                    onClick={() => update({ manageAccess : "public"})}
                />

                <Choice
                    selected={controlPassword}
                    title="Password protected"
                    desc="You need a password to0 open the control centre and change anything."
                    onClick={() => update({ manageAccess : "password"})}
                />

                {!controlPassword && (
                    <p className="rounded-lg bg-amber-400/10 p-3 text-sm text-amber-300">
                        Anyone who found this project can edit or delete it.
                    </p>
                )}
            </div>

            {both && (
                <label className="flex items-start gap-2 text-sm text-white/80">
                    <input 
                        type="checkbox"
                        checked = {draft.samePassword}
                        onChange={(e) => update({samePassword : e.target.checked })}
                        className="mt-1"
                    />
                    <span>
                        Use the same password for viewing and the control center.
                        <span className="block text-xs text-white/50">
                            Anyone who knows the control-enter password for viewing and the control centre password can edit or delete your invitation 
                        </span>
                    </span>
                </label>
            )}

            {viewingPrivate && (
                <Field
                    label={oneField ? "Password (invitation and control center)" : "Invitation password"}
                    hint="4 to 72 characters. We cant recover it for you"
                >
                    <input 
                        type="password" 
                        className={inputclass}
                        value={draft.password}
                        maxLength={72}
                        onChange={(e) => update({ password : e.target.value })}
                        autoComplete="new-password"
                    />
                </Field>
            )}

            {controlPassword && !oneField && (
                <Field
                    label="control-center password"
                    hint="4 to 72 characters. We cant recover it for you."
                >
                    <input 
                        type="password"
                        className={inputclass}
                        value={draft.managePassword}
                        maxLength={72}
                        onChange={(e) => update({ managePassword : e.target.value })}
                        autoComplete="new-password"
                    />
                </Field>
            )}
        </>
    );
}