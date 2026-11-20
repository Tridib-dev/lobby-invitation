import { decodeInvitePayload } from "@/src/lib/codec";
import { ImageResponse } from "next/og";

export async function GET(request : Request){

    const { searchParams } = new URL(request.url);
    const result = decodeInvitePayload(searchParams.get("p") ?? "");

    if (!result.ok){
        return new Response("Invalid invite" , { status : 400});
    }

    const { title, host, guest, date, location, accent }  = result.value;

    const when =  new Date(date).toLocaleString("en-IN",{
        dateStyle : "full",
        timeStyle : "short",
        timeZone : "Asia/Kolkata",
    });

    const image = new ImageResponse(
        (
            <div style = {{
                    width : "100%",
                    height : "100%",
                    display : "flex",
                    flexDirection : "column",
                    justifyContent : "space-between",
                    padding : 64,
                    background : "#0b0b12",
                    color : "white",
                    borderLeft : `24px solid ${accent}`,
                }}
            >
                <div style={{ display : "flex" , fontSize : 32 , color : accent , }}>
                    {guest ? `${guest}, you're invited!` : "You're invited"}
                </div>
                <div style={{ display : "flex" , fontSize : 76 , fontWeight : 700 }}>
                    {title}
                </div>

                <div style={{ display : "flex" , flexDirection : "column" , fontSize : 34 }}>
                    <div style={{ display:"flex" }}> {when} </div>
                    {location ? <div style={{display : "flex" }}>{location}</div> : null}
                    {host ? (
                        <div style={{ display : "flex", color : "#9a9ab0"}}>
                            Hosted by {host}
                        </div>
                    ) : null}
                </div>
            </div>
        ),
        {   
            width: 1200 ,
            height : 630 ,
        }
    );
    const buffer = await image.arrayBuffer();
    return new Response(buffer,{
        headers: {
            "Content-Type": "image/png",
            "Content-Length": String(buffer.byteLength),
            "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        },
    })
}