import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { identitySignals, identityVerifications, notifications, profiles } from "../../../../lib/db/schema";
import { runAiIdentityCheck } from "../../../../lib/ai-identity";

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
    const submission={mode:"two-level-ai-plus-admin",submittedAt:new Date().toISOString(),captures:Object.fromEntries(KEYS.map(key=>[key,{
      pathname:String(captures[key].pathname),hash:String(captures[key].hash),size:Number(captures[key].size||0),type:String(captures[key].type||"image/jpeg")
    }]))};
    const db=getDb();
    const profileRows=await db.select().from(profiles).where(eq(profiles.userId,current.user.id)).limit(1);
    const profile=profileRows[0];
    const lp=(profile?.lifestylePreferences||{}) as Record<string,any>;
    const showcase=Array.isArray(lp.profileShowcase)?lp.profileShowcase:[];
    const profilePhoto=showcase.find((x:any)=>x?.kind==="photo"&&typeof x.pathname==="string")?.pathname;
    if(!profilePhoto) return NextResponse.json({error:"Add at least one personal profile photo before verification."},{status:400});

    let ai:any;
    try{
      ai=await runAiIdentityCheck(profilePhoto,KEYS.map(k=>String(captures[k].pathname)));
    }catch(error){
      console.error("AI identity check failed",error);
      ai={configured:true,passed:false,reason:"AI verification could not be completed.",scores:[]};
    }

    if(ai.configured && !ai.passed){
      await db.update(identityVerifications).set({
        status:"rejected",
        provider:"aws-rekognition",
        providerReference:JSON.stringify({...submission,aiStatus:"failed",ai}),
        selfieFrontUrl:null,selfieLeftUrl:null,selfieRightUrl:null,updatedAt:new Date()
      }).where(eq(identityVerifications.userId,current.user.id));
      await db.insert(notifications).values({
        title:"Re-verification required",
        body:ai.reason||"Your verification photos could not be matched to your profile photo. Please capture new selfies and verify again.",
        audience:"all",targetUserId:current.user.id,showPopup:true,isActive:true
      }).catch(()=>{});
      return NextResponse.json({ok:false,status:"reverify_required",ai}, {status:422});
    }

    const verificationData={
      ...(profile?.verification||{}),
      aiAutoVerified:!!ai.passed,
      aiVerificationStatus:ai.passed?"passed":"pending",
      aiVerifiedAt:ai.passed?new Date().toISOString():null,
      adminVerificationStatus:"pending",
      photoVerified:!!ai.passed,
      phoneVerified:!!(profile?.verification as any)?.phoneVerified,
      emailVerified:!!(profile?.verification as any)?.emailVerified,
    };
    await db.update(identityVerifications).set({
      status:"pending",
      provider:ai.passed?"aws-rekognition":"ai-provider-pending",
      providerReference:JSON.stringify({...submission,aiStatus:ai.passed?"passed":"pending",ai}),
      selfieFrontUrl:String(captures.front.pathname),
      selfieLeftUrl:String(captures.left.pathname),
      selfieRightUrl:String(captures.right.pathname),
      updatedAt:new Date()
    }).where(eq(identityVerifications.userId,current.user.id));
    await db.update(profiles).set({verification:verificationData,updatedAt:new Date()}).where(eq(profiles.userId,current.user.id));
    for(const key of KEYS){
      const item=captures[key];
      await db.insert(identitySignals).values({
        userId:current.user.id,signalType:`free_camera_${key}`,fingerprint:String(item.hash),confidence:ai.scores?.length?Number(ai.scores[KEYS.indexOf(key)]||0):null,action:ai.passed?"ai_auto_verified_pending_admin":"submitted_for_ai_review"
      });
    }
    return NextResponse.json({ok:true,status:ai.passed?"ai_verified":"ai_pending",ai});
  }catch(error){
    console.error("private free verification submission failed",error);
    return NextResponse.json({error:"Could not submit verification."},{status:500});
  }
}

export async function GET(){
  const current=await getCurrentUser();
  if(!current) return NextResponse.json({error:"Sign in required."},{status:401});
  const db=getDb();
  const rows=await db.select().from(identityVerifications).where(eq(identityVerifications.userId,current.user.id)).limit(1);
  const row=rows[0];
  const profileRows=await db.select({verification:profiles.verification}).from(profiles).where(eq(profiles.userId,current.user.id)).limit(1);
  const verification=(profileRows[0]?.verification||{}) as Record<string,any>;
  let ref:any={}; try{ref=row?.providerReference?JSON.parse(row.providerReference):{};}catch{}
  let publicStatus="not_started";
  if(verification.adminVerificationStatus==="verified") publicStatus="verified";
  else if(verification.aiAutoVerified===true) publicStatus="ai_verified";
  else if(ref.aiStatus==="failed" || row?.status==="rejected") publicStatus="reverify_required";
  else if(row) publicStatus="ai_pending";
  return NextResponse.json({status:publicStatus,adminStatus:verification.adminVerificationStatus||row?.status||"not_started",aiAutoVerified:!!verification.aiAutoVerified,photoVerified:!!verification.photoVerified,phoneVerified:!!verification.phoneVerified,emailVerified:!!verification.emailVerified,requestInfo:verification.reverificationRequest||null,submittedAt:row?.updatedAt||row?.createdAt});
}
