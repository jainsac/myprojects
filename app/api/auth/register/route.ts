import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { users, profiles } from "../../../../lib/db/schema";
import { hashPassword, setSession } from "../../../../lib/auth";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");
    const displayName=String(body.displayName||"").trim();
    const city=String(body.city||"Delhi").trim();
    if(!email||!/^\S+@\S+\.\S+$/.test(email)||password.length<8||!displayName)return NextResponse.json({error:"Name, valid email and password (8+ characters) are required."},{status:400});
    const db=getDb();
    const existing=await db.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);
    if(existing.length)return NextResponse.json({error:"An account with this email already exists."},{status:409});
    const created=await db.insert(users).values({email,passwordHash:hashPassword(password)}).returning({id:users.id});
    const id=created[0].id;
    await db.insert(profiles).values({userId:id,displayName,city});
    await setSession(id);
    return NextResponse.json({ok:true,userId:id});
  }catch(error){console.error(error);return NextResponse.json({error:"Registration failed."},{status:500});}
}
