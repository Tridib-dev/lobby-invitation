import { NextResponse } from "next/server";
import { sql } from "@/src/server/db"
import { canManage } from "@/src/server/auth";
import { UpdateSchema } from "@/src/server/projectSchema";
import { checkPassword , hashPassword } from "@/src/server/secrets";


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
    if(!auth.ok) return NextResponse.json( { error : auth.status === 404 ? "Not found" : "Not allowed" } , { status : auth.status });
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
    const cur = (
    await sql`
        select visibility, password_hash, manage_access, manage_password_hash from projects where id = ${id}`
    )[0];
    if(!cur) return NextResponse.json({ error : "Not found"} , {status : 404});

    const visibility = d.visibility ?? cur.visibility;
    const manageAccess = d.manageAccess ?? cur.manage_access;
    let viewHash : string | null = visibility === "private" ? cur.password_hash : null;
    if(visibility === "private" && d.password) viewHash = await hashPassword(d.password);
    let manageHash : string | null = manageAccess === "password" ? cur.manage_password_hash : null;
    if(manageAccess === "password" && d.managePassword) manageHash = await hashPassword(d.managePassword);

    if(visibility === "private" && !viewHash) {
        return NextResponse.json({error : "password : A password-protected invitation needs a password" } , {status : 400});
    }

    if (manageAccess === "password" && !manageHash) {
        return NextResponse.json({error : "managePassword : A password-protected control-center needs a password"} , {status : 400});
    }

    if (visibility === "private" && manageAccess !== "password"){
        return NextResponse.json(
            { error : "manageAccess : A passsword protected invitation needs a password protected control center"},
            {status : 400},
        );
    }
    await sql`
        update projects set
            title = coalesce(${d.title ?? null}, title),
            location = coalesce(${d.location ?? null}, location),
            host_name = coalesce(${d.hostName ?? null}, host_name),
            message = coalesce(${d.message ?? null}, message),
            starts_at = coalesce(${d.startsAt ?? null}::timestamptz, starts_at),
            design = coalesce(${d.design ? JSON.stringify(d.design) : null}::jsonb, design),
            visibility = ${visibility},
            password_hash = ${viewHash},
            manage_access = ${manageAccess},
            manage_password_hash = ${manageHash},
            updated_at = now()
        where id = ${id}`;
    return NextResponse.json({ ok : true })
}

export async function DELETE(req : Request , { params } :{ params :  Promise<{ id : string }>}){
    const { id } = await params;
    const auth = await canManage(req,id);
    if(!auth.ok) return NextResponse.json({ error : auth.status === 404 ? "Not found" : "Not allowed"} , {status : auth.status});
    await sql`delete from projects where id = ${id}`;
    return NextResponse.json({ok : true});
}