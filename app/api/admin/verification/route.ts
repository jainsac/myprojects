import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { identityVerifications, profiles, users, notifications } from "../../../../lib/db/schema";

const FINAL=new Set(["verified","rejected","restricted"]);
const captureKeys=["selfieFrontUrl","selfieLeftUrl","selfieRightUrl"] as const;

async function deleteCaptures(row:any){
  const paths=captureKeys.map(k=>row[k]).filter((x:any):x is string=>typeof x==="string"&&x.startsWith("verification/"));
  if(paths.length) await Promise.allSettled(paths.map(path=>del(path)));
}

export async function GET(){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  const db=getDb();
  const rows=await db.select({
    userId:identityVerifications.userId,status:identityVerifications.status,legalName:identityVerifications.legalName,
    governmentIdType:identityVerifications.governmentIdType,governmentIdLast4:identityVerifications.governmentIdLast4,
    selfieFrontUrl:identityVerifications.selfieFrontUrl,selfieLeftUrl:identityVerifications.selfieLeftUrl,selfieRightUrl:identityVerifications.selfieRightUrl,
    provider:identityVerifications.provider,createdAt:identityVerifications.createdAt,updatedAt:identityVerifications.updatedAt,
    email:users.email,phone:users.phone,displayName:profiles.displayName,city:profiles.city,verification:profiles.verification
  }).from(identityVerifications).leftJoin(users,eq(users.id,identityVerifications.userId)).leftJoin(profiles,eq(profiles.userId,identityVerifications.userId))
    .orderBy(desc(identityVerifications.updatedAt));
  return NextResponse.json({verifications:rows});
}

export async function PATCH(request:Request){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  try{
    const body=await request.json(); const userId=String(body.userId||""); const action=String(body.action||"");
    if(!userId || !["verified","rejected","restricted","pending"].includes(action)) return NextResponse.json({error:"Invalid verification action."},{status:400});
    const db=getDb();
    const rows=await db.select().from(identityVerifications).where(eq(identityVerifications.userId,userId)).limit(1);
    const row=rows[0]; if(!row) return NextResponse.json({error:"Verification record not found."},{status:404});
    const requestInfo=String(body.requestInfo||"").trim().slice(0,1200);
    const profileRows=await db.select({verification:profiles.verification}).from(profiles).where(eq(profiles.userId,userId)).limit(1);
    const currentVerification=(profileRows[0]?.verification||{}) as Record<string,any>;

    if(action==="rejected" && !requestInfo){
      return NextResponse.json({error:"Please tell the user what additional information or document is required."},{status:400});
    }

    if(FINAL.has(action)) await deleteCaptures(row);

    const nextVerification={
      ...currentVerification,
      adminVerificationStatus:action==="verified"?"verified":action,
      adminVerifiedAt:action==="verified"?new Date().toISOString():null,
      photoVerified:action==="verified",
      aiAutoVerified:!!currentVerification.aiAutoVerified,
      reverificationRequest:action==="rejected"?requestInfo:null,
      rejectionReason:action==="rejected"?requestInfo:null,
    };

    await db.update(identityVerifications).set({
      status:action as any,
      verifiedAt:action==="verified"?new Date():null,
      selfieFrontUrl:FINAL.has(action)?null:row.selfieFrontUrl,
      selfieLeftUrl:FINAL.has(action)?null:row.selfieLeftUrl,
      selfieRightUrl:FINAL.has(action)?null:row.selfieRightUrl,
      updatedAt:new Date(),
      providerReference:JSON.stringify({decision:action,decidedAt:new Date().toISOString(),requestInfo:requestInfo||undefined,previous:row.providerReference||null})
    }).where(eq(identityVerifications.userId,userId));

    await db.update(profiles).set({verification:nextVerification,updatedAt:new Date()}).where(eq(profiles.userId,userId));

    if(action==="verified"){
      await db.insert(notifications).values({
        title:"Verification complete ✓",
        body:"Your profile has been manually verified by the Cuddl team.",
        audience:"all",targetUserId:userId,showPopup:true,isActive:true
      }).catch(()=>{});
    }else if(action==="rejected"){
      await db.insert(notifications).values({
        title:"Action required for verification",
        body:requestInfo,
        audience:"all",targetUserId:userId,showPopup:true,isActive:true
      }).catch(()=>{});
    }
    return NextResponse.json({ok:true,status:action,requestInfo:requestInfo||null});
  }catch(error){
    console.error("verification decision failed",error);
    return NextResponse.json({error:"Could not update verification."},{status:500});
  }
}
