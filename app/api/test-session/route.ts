import { NextResponse } from "next/server";
import { setSession, verifyTestSessionToken } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { users } from "../../../lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request:Request){
  const token=new URL(request.url).searchParams.get("token")||"";
  const userId=verifyTestSessionToken(token);
  if(!userId)return NextResponse.json({error:"Test session link is invalid or expired."},{status:401});
  const db=getDb();
  const rows=await db.select({id:users.id,email:users.email}).from(users).where(eq(users.id,userId)).limit(1);
  if(!rows[0] || !String(rows[0].email||"").startsWith("cuddl.test."))return NextResponse.json({error:"Test user not found."},{status:404});
  await setSession(rows[0].id);
  return NextResponse.redirect(new URL("/",request.url));
}
