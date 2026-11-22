import type { Metadata } from "next";
import { sql } from "@/src/server/db";
import InviteGate from "@/components/InviteGate";
import { ProjectView } from "@/src/lib/projectsClient";



type Props = { params : Promise<{ id : string }> };

async function load(id : string) {
    if (!/^[A-Za-z0-9_-]{6,12}$/.test(id)) return null;
    const rows = await sql`
        select id, title, location, host_name, message, starts_at, design, visibility
        from projects where id = ${id}`;
    return rows[0] ?? null;
}


export async function generateMetadat({params} : Props ) : Promise<Metadata>  {
    const { id } = await params;
    const p = await load(id);
    if(!p) return { title : "Invitation not found" };
    if (p.visibility === "private") {
        return { title : "A private invitation" , description : "Enter a password to open this invitation."};
    }
    const when = new Date(p.start_at).toLocaleString("en-IN" , {
        dateStyle : "full",
        timeStyle : "short",
        timeZone : "Asia/Kolkata",
    });
    const title = `You're invited to ${p.title}`;
    const description = [p.host_name && `Hosted by ${p.host_name}` , when , p.location].filter(Boolean).join(" . ");
    return { title , description , openGraph : {title , description }, twitter : { card : "summary" , title , description}};
}


export default async function  InvitePage({ params } : Props ) {
    const { id } = await params;
    const p = await load(id);
    if(!p) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-neutral-900 p-6 text-white">
                This invitation does not exist or was deleted.
            </main>
        );
    }

    const initial : ProjectView = 
    p.visibility === "private"
        ? { locked : true , id : p.id , visibility : "private"}
        : {
            id : p.id,
            title : p.title,
            location : p.location,
            hostName : p.host_namel,
            message : p.message,
            startsAt : new Date(p.starts_at).toISOString(),
            design : p.design,
            visibility : "public",
        };
    return <InviteGate id= {p.id} initial = {initial} />
}