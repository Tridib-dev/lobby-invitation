import { NextResponse } from "next/server";
import { sql } from "@/src/server/db"
import { canManage } from "@/src/server/auth";
import { UpdateSchema } from "@/src/server/projectSchema";
import { checkPassword } from "@/src/server/secrets";


export async function GET(req:Request , {params} : { params : Promise<{ id : string }>}) {
    const { id } = await params;
    const rows = await sql`
        select id, title, location, host_name, message, starts_at, design, visibility, password_hash
        from projects where id = ${id}`
    const p = rows[0];
    if(!p) return NextResponse.json({error : "Not found"} , { status : 404 });
    if (p.visibility === "private") {
        const pw = req.headers.get("x-password");
        if(!pw  || !p.password_hash || !(await checkPassword(pw,p.password_hash))) {
            return NextResponse.json({ id : p.id , visibility : "private" , locked : true}, {status : pw ? 401 : 200})
        }
    }
    return NextResponse.json({
        id : p.id,
        title: p.title,
        location : p.location,
        hostName : p.host_name,
        message : p.message,
        startsAt : p.starts_at,
        design : p.design,
        visibility : p.visibility,
    });
}


export async function PATCH(req : Request , { params } : {params : Promise<{ id : string}> }) {
    const { id } = await params;
    const auth = await canManage(req,id);
    if(!auth.ok) return NextResponse.json( { error : auth.status == 404 ? "Not found" : "Not allowed" } , { status : auth.status });
    let body : unknown;
    try{
        body = await req.json();
    } catch {
        return NextResponse.json({ error : "Invalid JSON" } , { status : 400 });
    }
    const parsed = UpdateSchema.safeParse(body);
    if(!parsed.success) {
            const issue = parsed.error.issues[0];
            return NextResponse.json({ error: `${issue?.path.join(".") || "body"}: ${issue?.message ?? "Invalid input"}` }, { status: 400 });
    }
    const d = parsed.data;
    await sql`
        update projects set
        title = coalesce(${d.title ?? null}, title),
        location = coalesce(${d.location ?? null}, location),
        host_name = coalesce(${d.hostName ?? null}, host_name),
        message = coalesce(${d.message ?? null}, message),
        starts_at = coalesce(${d.startsAt ?? null}::timestamptz, starts_at),
        design = coalesce(${d.design ? JSON.stringify(d.design) : null}::jsonb, design),
        updated_at = now()
        where id = ${id}`;
    return NextResponse.json({ok : true});
}

export async function DELETE(req : Request , { params } :{ params :  Promise<{ id : string }>}){
    const { id } = await params;
    const auth = await canManage(req,id);
    if(!auth.ok) return NextResponse.json({ error : auth.status === 404 ? "Not found" : "Not allowed"} , {status : auth.status});
    await sql`delete from projects where id = ${id}`;
    return NextResponse.json({ok : true});
}