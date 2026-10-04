import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { identityVerifications, profiles } from "../../../../lib/db/schema";

export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const body=await request.json();
    const response=String(body.response||"").trim().slice(0,3000);
    if(!response)return NextResponse.json({error:"Please provide the requested information."},{status:400});
    const db=getDb();
    const rows=await db.select({verification:profiles.verification}).from(profiles).where(eq(profiles.userId,current.user.id)).limit(1);
    const verification=(rows[0]?.verification||{}) as Record<string,any>;
    await db.update(profiles).set({
      verification:{...verification,reverificationResponse:response,reverificationResponseAt:new Date().toISOString()},
      updatedAt:new Date()
    }).where(eq(profiles.userId,current.user.id));
    await db.update(identityVerifications).set({updatedAt:new Date()}).where(eq(identityVerifications.userId,current.user.id));
    return NextResponse.json({ok:true});
  }catch(error){
    console.error("verification response failed",error);
    return NextResponse.json({error:"Could not submit verification response."},{status:500});
  }
}
