import { isAppleHost } from "@/src/lib/music";
import { NextResponse } from "next/server";


export async function GET(_req : Request , { params } : { params : Promise<{ id : string }> }) {
    const { id } = await params;
    if(!/^\d{1,12}$/.test(id)) return NextResponse.json({ error : "Bad Id" } , { status : 400 });
    try {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${id}` , {next : {revalidate : 86400 } });
        const data = (await res.json()) as { results?: {previewUrl?: string; trackViewUrl?: string }[] };

        const t = data.results?.[0];
        if(!t?.previewUrl || !isAppleHost(t.previewUrl)) {
            return NextResponse.json({error : "No Preview"} , {status : 404});
        }
        return NextResponse.json(
            {previewUrl : t.previewUrl , appleUrl : t.trackViewUrl ?? null },
            {headers : {"Cache-Control" : "public , s-maxage=86400"} },
        );
    }catch {
        return NextResponse.json({ error : "Lookup failed" } , {status : 502});
    }
} 