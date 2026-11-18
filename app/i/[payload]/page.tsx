import {decodeInvitePayload} from "@/src/lib/codec";
import type { Metadata } from "next";
import { Suspense } from "react";


type Props = { params : Promise<{payload : string}>};

export async function generateMetadata({ params } : Props) : Promise<Metadata> {
    const {payload} = await params ;
    const result = decodeInvitePayload(payload);

    if(!result.ok) return { title : "Invalid invitation"};
    
    const { title , host , guest } = result.value;
    const heading = guest? `${guest} , you're invited to ${title}` : `You are invited to ${title}`;
    
    const description = host ? `Hosted by ${host}. Open to View your invitation.` : "Open to view your invitation.";
    
    const image = `/api/og?p=${payload}`;

    return {
        title: heading,
        description,
        openGraph : {
            title : heading,
            description,
            images : [{ url : image , width : 1200 , height : 630, type : "image/png" , alt: `${title} invitation`}],
        },
        twitter : {card : "summary_large_image", images : [image]},
    };
}

export default async function InviteContent({params} : Props) {
    const { payload }  = await params;
    const result = decodeInvitePayload(payload);

    if (!result.ok){
        return <main className="p-10">This invitation link is invalid.</main>
    }
    
    return (
        <main className="p-10">
            <h1 className="text-4xl font-bold">{result.value.title}</h1>
            <p>Hosted by {result.value.host}</p>
        </main>
    )
}


export async function InvitePage({params} : Props){
    return(
        <Suspense
            fallback = {
                <main className="flex min-h-screen items-center justify-center">
                    Loading your invitation ...
                </main>
            }
        >
            <InviteContent params={params} />
        </Suspense>
    );

}