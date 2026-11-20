import{
    DEFAULT_ACCENT,
    INVITE_VERSION,
    LIMITS,
    type InvitePayload,
} from "@/src/types/invite" ;
import {
  FALLBACK_TEMPLATE,
  getTemplateMeta,
  type FieldDef,
} from "@/src/templates/meta";




const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal : true});


function bytesToBase64Url(bytes:Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);

    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


function  base64UrlToBytes(input:string):Uint8Array{
    if (!/^[A-Za-z0-9_-]*$/.test(input)) {
        throw new Error("Invalid base64Url characters");
    }

    const b64 = input.replace(/-/g,"+").replace(/_/g,"/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length ; i++){
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

const MAX_ENCODED_LENGTH = 4000;
export type DecodeResult = 
| { ok : true ; value : InvitePayload }
| { ok : false ; error : string };


function cleanString(value : unknown, max : number) : string {
    if (typeof value !== "string") return "";

    const stripped = value
        .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
        .trim();

    return Array.from(stripped).slice(0,max).join("");
}


function sanitizeFields(raw : unknown , defs : readonly FieldDef[],) : Record<string,string> {
    if (typeof raw !== "object" || raw ===  null) return {};
    const input = raw as Record<string,unknown>;
    const out : Record<string,string> = {};


    for (const def of defs){
        if(!Object.prototype.hasOwnProperty.call(input,def.key)) continue;
        const value = input[def.key];
        if (typeof value !== "string") continue;

        if (def.type === "text"){
            const text = cleanString(value,def.max);
            if(text) out[def.key] = text;
        }else if(def.type ==="color"){
            if(/^#[0-9a-fA-F]{6}$/.test(value)) out[def.key] = value; 
        }else if( def.options.includes(value))  {
            out[def.key] = value;
        }
    }
    return out;
}


export function parseInvitePayload(raw : unknown) : DecodeResult{
    if(typeof raw !== "object" || raw === null) {
        return { ok : false , error : "Payload is not an object"};
    } 

    const r = raw as Record<string, unknown> ;

    if (r.v !== INVITE_VERSION) {
        return {ok : false , error : "Unsupported invite version" }
    }

    const title = cleanString(r.title,LIMITS.title);
    if(!title) return {ok: false , error : "Title is required"};

    const date = cleanString(r.date,40);
    if (Number.isNaN(Date.parse(date))){
        return {ok : false , error : "Invalid date"};
    }
    
    const accent = typeof r.accent ==="string" && /^#[0-9a-fA-F]{6}$/.test(r.accent) ? r.accent : DEFAULT_ACCENT;
    const meta = (typeof r.template === "string" ? getTemplateMeta(r.template) : undefined) ?? FALLBACK_TEMPLATE;
    const fields = sanitizeFields(r.fields,meta.fields);
    
    return {
        ok : true,
        value : {
            v : INVITE_VERSION,
            title,
            host: cleanString(r.host,LIMITS.host),
            guest : cleanString(r.guest , LIMITS.guest),
            date,
            location : cleanString(r.location,LIMITS.location),
            note: cleanString(r.note,LIMITS.note),
            template: meta.id,
            accent,
            ...(Object.keys(fields).length > 0 ? { fields } : {}),
        },
    };
    
    
}



// Encoding the Invite payl;oad in string .... 
export function encodeInvitePayload(payload :  InvitePayload) : string {
    const json = JSON.stringify(payload);
    return bytesToBase64Url(encoder.encode(json));
}


export  function decodeInvitePayload(encoded : string) : DecodeResult {
    if (encoded.length ===  0 || encoded.length > MAX_ENCODED_LENGTH){
        return {ok : false , error : "Invalid link length"};
    }

    try{
        const json = decoder.decode(base64UrlToBytes(encoded));
        return parseInvitePayload(JSON.parse(json));
    }catch{
        return { ok : false , error : "Link is corrupted or malformed bruhhh"};
    }
}


