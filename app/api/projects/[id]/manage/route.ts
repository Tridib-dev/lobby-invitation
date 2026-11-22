import { NextResponse } from "next/server";
import { sql } from "@/src/server/db";
import { canManage } from "@/src/server/auth";



export async function GET(req : Request , {params} : { params : Promise<{id : string}>}) {
    const { id } = await params;
    const auth = await canManage(req , id);
    if(!auth.ok) {
        if(auth.status === 404) return NextResponse.json({error : "Not found."} , {status : 404});
        const sentPassword = !!req.headers.get("x-password");
        return NextResponse.json({ id , locked : true , manageAccess : "password" }, { status : sentPassword ? 401 : 200 });
    }
    const rows = await sql`
        select id, title, location, host_name, message, starts_at, design, visibility, manage_access
        from projects where id = ${id}`;
    const p = rows[0];
    if(!p) return NextResponse.json({error : "Not found" } , { status : 404 });
    return NextResponse.json({
        id : p.id,
        title: p.title,
        location : p.location,
        hostName : p.host_name,
        message : p.message,
        startsAt : p.starts_at,
        design : p.design,
        visibility : p.visibility,
        manageAccess : p.manage_access,
    });
}