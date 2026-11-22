import { timingSafeEqual } from "crypto";
import { sql } from "./db";
import { hashToken , checkPassword } from "./secrets";

const same = (a : string , b : string) => 
    a.length === b.length && 
    timingSafeEqual(Buffer.from(a) , Buffer.from(b));


export async function  canManage(req:Request , id : string) : Promise<{ ok : true } | {ok : false ; status : 401 | 404 }> {
    const rows = await sql`select visibility, password_hash, edit_token_hash from projects where id = ${id}`;
    const p = rows[0];
    if(!p) return {ok : false , status : 404};
    const token = req.headers.get("x-edit-token");
    const password = req.headers.get("x-password");
    if (token && same(hashToken(token), p.edit_token_hash)) return{ok : true};
    if (p.visibility === "private" && password && p.password_hash &&(await checkPassword(password,p.password_hash))) {
        return { ok : true};
    }
    return { ok : false , status : 401 };
}