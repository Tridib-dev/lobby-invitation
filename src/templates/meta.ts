export type FieldDef =
    | {key: string; label : string; type : "text"; max : number; default: string } 
    | {key: string; label : string; type : "color"; default: string } 
    | {key: string; label : string; type : "select"; options : string[]; default: string } ;


export interface TemplateMeta {
    id : string;
    name:  string;
    eventType : string;
    fields: FieldDef[];
}

const classic : TemplateMeta = {
    id : "classic",
    name : "Classic",
    eventType : "general",
    fields : [
        {key : "tagline" , label : "Tagline" , type : "text" , max : 60, default: "Join Us" },
        {key : "paper" , label : "Paper colour" , type : "color" , default: "#ffffff" },
        {key: "font", label: "Font", type: "select", options: ["sans", "serif", "mono"], default: "sans" },
    ],
}

export const TEMPLATE_META: readonly TemplateMeta[] = [classic];
export const FALLBACK_TEMPLATE: TemplateMeta = classic;

export function getTemplateMeta(id: string): TemplateMeta | undefined {
  return TEMPLATE_META.find((t) => t.id === id);
}