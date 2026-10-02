import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { identitySignals, identityVerifications } from "../../../../lib/db/schema";

const required = ["government_id","live_selfie_front","live_selfie_left","live_selfie_right"];

export async function GET(){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const db=getDb();
  const rows=await db.select().from(identityVerifications).where(eq(identityVerifications.userId,current.user.id)).limit(1);
  if(!rows.length)return NextResponse.json({status:"not_started",providerConfigured:false,mode:"free_manual",required});
  return NextResponse.json({
    status:rows[0].status,
    provider:rows[0].provider,
    providerConfigured:Boolean(process.env.IDENTITY_PROVIDER_NAME && process.env.IDENTITY_PROVIDER_API_KEY),
    mode:rows[0].provider==="manual-free" ? "free_manual" : "provider",
    required,
  });
}

export async function POST(request: Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  let body:any={};
  try{ body=await request.json(); }catch{}
  if(body?.mode!=="manual"){
    return NextResponse.json({error:"Free/manual verification mode must be selected."},{status:400});
  }
  const captures=body?.captures;
  if(!captures || !captures.front || !captures.left || !captures.right){
    return NextResponse.json({error:"All three selfie captures are required."},{status:400});
  }
  for(const key of ["front","left","right"]){
    const c=captures[key];
    if(typeof c.hash!=="string" || !/^[a-f0-9]{64}$/i.test(c.hash)){
      return NextResponse.json({error:"Invalid selfie capture fingerprint."},{status:400});
    }
    if(!Number.isFinite(c.size) || c.size<=0 || c.size>10_000_000){
      return NextResponse.json({error:"Invalid selfie capture size."},{status:400});
    }
  }
  const db=getDb();
  const now=new Date();
  const reference=JSON.stringify({
    mode:"free_manual",
    submittedAt:now.toISOString(),
    captures:Object.fromEntries(["front","left","right"].map(k=>[k,{hash:captures[k].hash,size:captures[k].size,type:captures[k].type||"image/*"}])),
  });
  await db.update(identityVerifications).set({
    provider:"manual-free",
    providerReference:reference,
    status:"pending",
    updatedAt:now,
  }).where(eq(identityVerifications.userId,current.user.id));
  for(const key of ["front","left","right"]){
    await db.insert(identitySignals).values({
      userId:current.user.id,
      signalType:"selfie_capture",
      fingerprint:captures[key].hash,
      confidence:1,
      action:"manual_review",
      createdAt:now,
    });
  }
  return NextResponse.json({status:"pending",mode:"free_manual",providerConfigured:false,required,message:"Verification submitted for manual review. No selfie image was uploaded or stored."});
}
