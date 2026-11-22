import { NextResponse } from "next/server";
import { sql } from "@/src/server/db";
import { CreateSchema } from "@/src/server/projectSchema"; 
import { newId , hashPassword } from "@/src/server/secrets";


export async function POST(req:Request) {
    let body : unknown;
    try{
        body = await req.json();
    } catch {
        return NextResponse.json({ error : "Invalid JSON" }, {status : 400});
    }
    const parsed = CreateSchema.safeParse(body);
    if(!parsed.success) {
            const issue = parsed.error.issues[0];
            return NextResponse.json({ error: `${issue?.path.join(".") || "body"}: ${issue?.message ?? "Invalid input"}` }, { status: 400 });
    }
    const d = parsed.data;
    const viewHash = d.visibility ==="private" ? await hashPassword(d.password!) : null;
    const manageHash = d.manageAccess === "password" ? await hashPassword(d.managePassword!) : null;
    for (let attempt = 0 ; attempt < 3 ; attempt++) {
        const id = newId();
        try{
            await sql`
                insert into projects (id, title, location, host_name, message, starts_at, design, visibility, password_hash, manage_access, manage_password_hash)
                values (${id}, ${d.title}, ${d.location}, ${d.hostName}, ${d.message}, ${d.startsAt}, ${JSON.stringify(d.design)}::jsonb, ${d.visibility}, ${viewHash}, ${d.manageAccess}, ${manageHash})`;

            return NextResponse.json ( { id },{status : 201});
        } catch(e) {
            if((e as { code?: string }).code !== "23505"){
                console.error(e);
                return NextResponse.json({error : "Couldn't be saved"} , { status : 500 });
            }
        }
    }
    return NextResponse.json({error : "Could not create id , try again !"} , { status : 500 });
}