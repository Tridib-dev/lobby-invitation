import { randomBytes , createHash } from "crypto";
import bcrypt from "bcryptjs";

export const newId = () => randomBytes(6).toString("base64url");
export const newToken = () =>randomBytes(24).toString("base64url");
export const hashToken = (t : string) => createHash("sha256").update(t).digest("hex");
export const hashPassword = (p : string) => bcrypt.hash(p,10);
export const checkPassword = (p : string , hash : string ) => bcrypt.compare(p,hash);