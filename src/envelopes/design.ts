import { Design } from "../lib/projectsClient";
import { getEnvelopeTheme , type EnvelopeTheme } from "./theme";

export const ACCENTS = [
    {id : "rose" , name : "Rose" , hex : "#ec3750"},
    {id : "gold" , name : "Gold" , hex : "#b8923f" },
    {id : "emerald" , name : "Emerald" , hex : "#1f7a5a" },
    {id : "sapphire" , name : "Sapphire" , hex : "#2c4f9e" },
    {id : "plum" , name : "Plum" , hex : "#6b2d5c" },
    {id : "charcoal" , name : "Charcoal" , hex : "#2b2b2b" },
] as const ;


export const SEALS = [
    { id : "sprig" , name : "Sprig" , emblem : "sprig" },
    { id : "rose" , name : "Rose" , emblem : "🌹" },
    { id : "party" , name : "Party" , emblem : "🎉" },
    { id : "ring" , name : "Ring" , emblem : "💍" },
] as const ;


export function accentHex(id?: string) : string | undefined {
    return ACCENTS.find((a) => a.id === id)?.hex;
}

export function buildTheme(design?: Partial<Design> | null) : EnvelopeTheme {
    const base = getEnvelopeTheme(design?.theme ?? "wedding");
    const seal = SEALS.find((s) => s.id === design?.seal);
    if(!seal) return base;
    return { ...base , seal : {...base.seal , emblem : seal.emblem } };
}