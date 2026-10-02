import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, profiles } from "./db/schema";

const COOKIE="cuddl_session";
const secret=()=>process.env.AUTH_SECRET || "cuddl-dev-secret-change-me";

function sign(value:string){return createHmac("sha256",secret()).update(value).digest("base64url");}
function token(userId:string){return `${userId}.${sign(userId)}`;}
function verify(value:string){const [id,sig]=value.split("."); if(!id||!sig)return null; const expected=sign(id); if(sig.length!==expected.length)return null; return timingSafeEqual(Buffer.from(sig),Buffer.from(expected))?id:null;}

export function hashPassword(password:string){const salt=randomBytes(16).toString("hex"); const hash=scryptSync(password,salt,64).toString("hex"); return `${salt}:${hash}`;}
export function verifyPassword(password:string,stored:string){const [salt,hex]=stored.split(":"); if(!salt||!hex)return false; const hash=scryptSync(password,salt,64); const expected=Buffer.from(hex,"hex"); return expected.length===hash.length && timingSafeEqual(hash,expected);}

export async function setSession(userId:string){(await cookies()).set(COOKIE,token(userId),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*30});}
export async function clearSession(){(await cookies()).set(COOKIE,"",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});}

export async function getCurrentUser(){
  const value=(await cookies()).get(COOKIE)?.value;
  const userId=value?verify(value):null;
  if(!userId)return null;
  const db=getDb();
  const rows=await db.select({user:users,profile:profiles}).from(users).leftJoin(profiles,eq(profiles.userId,users.id)).where(eq(users.id,userId)).limit(1);
  return rows[0] ?? null;
}
