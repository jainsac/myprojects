import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { identitySignals, identityVerifications } from "../../../../lib/db/schema";

const KEYS=["front","left","right"] as const;

export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current) return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const body=await request.json();
    const captures=body?.captures && typeof body.captures==="object" ? body.captures : {};
    const prefix=`verification/${current.user.id}/`;
    for(const key of KEYS){
      const item=captures[key];
      if(!item || typeof item.pathname!=="string" || !item.pathname.startsWith(prefix) || !item.pathname.endsWith(".jpg") ||
         typeof item.hash!=="string" || !/^[a-f0-9]{64}$/i.test(item.hash)){
        return NextResponse.json({error:"All three private camera captures are required."},{status:400});
      }
    }
    const submission={mode:"private-local-camera",submittedAt:new Date().toISOString(),captures:Object.fromEntries(KEYS.map(key=>[key,{
      pathname:String(captures[key].pathname),hash:String(captures[key].hash),size:Number(captures[key].size||0),type:String(captures[key].type||"image/jpeg")
    }]))};
    const db=getDb();
    await db.update(identityVerifications).set({
      status:"pending",
      provider:"local-free-private",
      providerReference:JSON.stringify(submission),
      selfieFrontUrl:String(captures.front.pathname),
      selfieLeftUrl:String(captures.left.pathname),
      selfieRightUrl:String(captures.right.pathname),
      updatedAt:new Date()
    }).where(eq(identityVerifications.userId,current.user.id));
    for(const key of KEYS){
      const item=captures[key];
      await db.insert(identitySignals).values({
        userId:current.user.id,signalType:`free_camera_${key}`,fingerprint:String(item.hash),confidence:null,action:"submitted_for_manual_review"
      });
    }
    return NextResponse.json({ok:true,status:"pending"});
  }catch(error){
    console.error("private free verification submission failed",error);
    return NextResponse.json({error:"Could not submit verification."},{status:500});
  }
}

export async function GET(){
  const current=await getCurrentUser();
  if(!current) return NextResponse.json({error:"Sign in required."},{status:401});
  const rows=await getDb().select().from(identityVerifications).where(eq(identityVerifications.userId,current.user.id)).limit(1);
  const row=rows[0];
  return NextResponse.json(row?{status:row.status,provider:row.provider,submittedAt:row.updatedAt||row.createdAt}:{status:"not_started"});
}
