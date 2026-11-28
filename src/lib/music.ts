export interface MusicPack {
    trackId : number;
    name : string;
    artist : string;
    artwork : string;
    start : number;
    end : number;
}

export const PREVIEW_SECONDS = 30;
export const MIN_LOOP = 5;

export function isAppleHost(u : string) : boolean {
    try { 
        const url = new URL(u);
        return url.protocol === "https:" && (url.hostname.endsWith(".mzstatic.com") || url.hostname.endsWith(".apple.com"));
    } catch {
        return false;
    }
}