import * as THREE from "three";
import type { flapMotif } from "@/src/envelopes/theme";

function tinted(img : HTMLImageElement, w: number , h: number , tint?: string ) : CanvasImageSource {
    if (!tint) return img;
    const c = document.createElement("canvas");
    c.width = Math.round(w);
    c.height = Math.round(h);
    const g = c.getContext("2d")!;
    g.drawImage(img, 0 , 0 , c.width , c.height);
    g.globalCompositeOperation = "multiply";
    g.fillStyle = tint;
    g.fillRect(0,0, c.width,c.height);
    return c; 
}



export function paintMotif(g : CanvasRenderingContext2D , w: number , h : number , m : flapMotif , onDone : () => void) {
    const img = new Image();
    img.onload = () => {
        const mh = h * m.height;
        const mw = mh * (img.width / img.height);
        g.save();
        
        g.globalCompositeOperation = m.blend ?? "screen";
        g.globalAlpha = m.opacity;
        g.drawImage(tinted(img , mw, mh, m.tint), (w - mw) / 2 , h * m.y - mh / 2,mw , mh );
        g.restore()
        onDone();
    };

    img.onerror = onDone;
    img.src = m.src;
}


export function makeMotifBump(m : flapMotif | undefined , w : number , h : number , fallback : THREE.Texture) : THREE.Texture {
    if(!m || !m.raised) return fallback;

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = "#000";
    g.fillRect(0,0,w,h);
    const tex = new THREE.CanvasTexture(c);
    const img = new Image();
    img.onload = () => {
        const mh = h * m.height;
        const mw = mh * (img.width / img.height);
        g.filter = "blur(2px)";
        g.drawImage(img , (w - mw) / 2 , h * m.y - mh / 2,mw , mh );
    };
    img.src = m.src;
    return tex;
}
