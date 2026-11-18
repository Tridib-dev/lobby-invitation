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

const test = new Uint8Array([0xfb,0xff,0xfe]);
const s = bytesToBase64Url(test);
console.log(s, base64UrlToBytes(s));
