import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { users } from "../../../../lib/db/schema";
import { verifyPassword, setSession } from "../../../../lib/auth";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");
    const db=getDb();
    const rows=await db.select().from(users).where(eq(users.email,email)).limit(1);
    const user=rows[0];
    if(!user || !user.passwordHash || !verifyPassword(password,user.passwordHash))return NextResponse.json({error:"Invalid email or password."},{status:401});
    await setSession(user.id);
    return NextResponse.json({ok:true,userId:user.id});
  }catch(error){console.error(error);return NextResponse.json({error:"Login failed."},{status:500});}
}
