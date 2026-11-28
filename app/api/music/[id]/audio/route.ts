import { isAppleHost } from "@/src/lib/music";

export async function GET(_req : Request , {params} : { params : Promise<{ id : string }> }) {
    const { id } = await params;
    if (!/^\d{1,12}$/.test(id)) return new Response("Bad id" , {status : 400});
    try {
        const meta = await fetch(`https://itunes.apple.com/lookup?id=${id}`, { next : { revalidate : 86400 } });
        const data = (await meta.json()) as {results?: { previewUrl?: string}[] };
        const url  = data.results?.[0]?.previewUrl;
        if(!url || !isAppleHost(url)) return new Response("No preview" , {status : 404});
        const audio = await fetch(url);
        if(!audio.ok)   return new Response("Upstream error" , { status : 502 });

        return new Response( await audio.arrayBuffer() , {
            headers : {
                "Content-Type" : audio.headers.get("content-type") ?? "audio/mp4",
                "Cache-Control" : "public, s-maxage=86400",
            },
        });
    }catch {
        return new Response("Failed" , {status : 502});
    }
}