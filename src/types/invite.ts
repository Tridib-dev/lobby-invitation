export const INVITE_VERSION= 1 as const;

export const TEMPLATES = ["envelope","terminal","holo-pass"] as const;
export type TemplateId = (typeof TEMPLATES)[number];



export interface InvitePayload{
    v : typeof INVITE_VERSION;
    title : string;
    host : string;
    guest : string;
    date : string;
    location : string;
    note : string;
    template : string;
    accent : string;
    fields?: Record<string, string>;
}


//  Dont dare to change the limits or ur software is gonna chole and wont work as expected .. 
export const LIMITS = {
    title : 80,
    host : 50,
    guest : 50,
    location : 120,
    note : 250,
} as const;

export const DEFAULT_ACCENT = "#ec3750";
export const DEFAULT_TEMPLATE = "classic"