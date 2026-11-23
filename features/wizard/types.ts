import type { Design } from "@/src/lib/projectsClient";

export const LIMITS = {
    title : 80,
    location : 120,    
    hostName : 60,
    message : 400,
} as const;

export type Draft = {
    title : string;
    startsAtLocal : string;
    location : string;
    hostName : string;
    message : string;
    visibility : "public" | "private";
    password : string;
    manageAccess : "public" | "password";
    managePassword : string;
    samePassword : boolean;
    design : Design
}

export const EMPTY_DRAFT : Draft = {
    title : "",
    startsAtLocal : "",
    location : "",
    message : "",
    hostName : "",
    visibility : "public",
    password : "", 
    manageAccess : "public",
    managePassword : "",
    samePassword : true,
    design : { v : 1 , theme : "wedding" },
}

export function managePassword(d : Draft) : string | undefined {
    if(d.manageAccess !== "password") return undefined;
    return d.visibility === "private" && d.samePassword ? d.password : d.managePassword;
}

const okPW = (s? : string) => !!s && s.length >= 4 && s.length <= 72;


export function validateStep(id : string , d : Draft) : string | null {
    if (id === "event") {
        if (!d.title.trim()) return "Set the title of your invitation";
        if(!d.startsAtLocal || Number.isNaN(Date.parse(d.startsAtLocal))) return "Pick a date and time for the invitations";
    }
    if (id === "access") {
        if(d.visibility === "private" && !okPW(d.password)) {
            return "Choose an invitation password (4 to 72 characters).";
        }
        if(d.visibility === "private" && d.manageAccess !== "password") {
            return "A password protected invitation needs a password-protected control center."; 
        }
        if(d.manageAccess === "password" && !okPW(managePassword(d))) {
            return "Choose a control center password (4 to 72 characters).";
        }
    }
    return null;
}