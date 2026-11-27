import { NextResponse } from "next/server";

interface ItunesTrack {
    trackId : number;
    trackName : string;
    artistName : string;
    artworkUrl100?: string;
    previewUrl?: string;
}


export async function GET(req : Request) {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    
    if(q.length < 2 || q.length > 80) return NextResponse.json({ tracks : [] });
    try {
        const res = await fetch(
                        `https://itunes.apple.com/search?media=music&entity=song&limit=12&term=${encodeURIComponent(q)}`,
            {next : { revalidate : 3600 }},
        );
        if(!res.ok) return NextResponse.json({ error : "Search Unavailable"}, { status : 502 });

        const data = (await res.json()) as { results?: ItunesTrack[]};
        const tracks =(data.results ?? []).filter((t) => t.previewUrl && t.artworkUrl100).map((t) => ({
            trackId : t.trackId,
            name : t.trackName,
            artist : t.artistName,
            artwork : t.artworkUrl100!.replace("100x100" , "300x300"),
            previewUrl : t.previewUrl,
        }));
        return NextResponse.json({ tracks } , { headers : { "Cache-Control" : "public, s-maxage=3600"} });
    } catch {
        return NextResponse.json({ error : "Search Unavailable" }, { status : 502 });
    }
}