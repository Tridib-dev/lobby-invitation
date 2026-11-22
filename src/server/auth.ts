import { sql } from "./db";
import { checkPassword } from "./secrets";

export async function  canManage(req:Request , id : string) : Promise<{ ok : true } | {ok : false ; status : 401 | 404 }> {
    const rows = await sql`select manage_access, manage_password_hash from projects where id = ${id}`;
    const p = rows[0];
    if(!p) return {ok : false , status : 404};
    if(p.manage_access === "public") return {ok : true};
    const pw = req.headers.get("x-password");
    if(pw && p.manage_password_hash && (await checkPassword(pw , p.manage_password_hash))) return {ok : true};
    return { ok : false , status : 401 };
}