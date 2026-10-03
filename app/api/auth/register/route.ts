import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { users, profiles, identityVerifications } from "../../../../lib/db/schema";
import { hashPassword, setSession } from "../../../../lib/auth";

const emailPattern=/^\S+@\S+\.\S+$/;
const phonePattern=/^[+]?\d{10,15}$/;

export async function POST(request:Request){
  try{
    const body=await request.json();
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");
    const displayName=String(body.displayName||"").trim();
    const legalName=String(body.legalName||"").trim();
    const phone=String(body.phone||"").replace(/[\s()-]/g,"");
    const city=String(body.city||"Delhi").trim();
    const governmentIdType=String(body.governmentIdType||"").trim().toUpperCase();
    const governmentIdLast4=String(body.governmentIdLast4||"").replace(/\D/g,"").slice(-4);

    const passwordChecks={length:password.length>=8,upper:/[A-Z]/.test(password),lower:/[a-z]/.test(password),number:/[0-9]/.test(password),special:/[^A-Za-z0-9]/.test(password)};
    if(!emailPattern.test(email)||!displayName||!legalName||!phonePattern.test(phone)){
      return NextResponse.json({error:"Please check your profile details, phone number and email address."},{status:400});
    }
    if(!Object.values(passwordChecks).every(Boolean)){
      return NextResponse.json({error:"Password must be at least 8 characters and include an uppercase letter, lowercase letter, number and special character."},{status:400});
    }
    if(!["AADHAAR","PAN","PASSPORT","DRIVING_LICENSE","VOTER_ID","OTHER"].includes(governmentIdType) || governmentIdLast4.length!==4){
      return NextResponse.json({error:"Government ID type and its last 4 digits are required."},{status:400});
    }

    const db=getDb();
    const existing=await db.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);
    if(existing.length)return NextResponse.json({error:"An account with this email already exists."},{status:409});

    const created=await db.insert(users).values({
      authUserId:`local:${email}`,
      email,
      phone,
      passwordHash:hashPassword(password),
    }).returning({id:users.id});
    const id=created[0].id;

    await db.insert(profiles).values({userId:id,displayName,city});
    await db.insert(identityVerifications).values({
      userId:id,
      legalName,
      governmentIdType,
      governmentIdLast4,
      status:"pending",
      provider:process.env.IDENTITY_PROVIDER_NAME || null,
    });

    await setSession(id);
    return NextResponse.json({
      ok:true,
      userId:id,
      verification:{status:"pending",required:["government_id","live_selfie_front","live_selfie_left","live_selfie_right"]},
    });
  }catch(error){
    console.error(error);
    return NextResponse.json({error:"Registration failed."},{status:500});
  }
}
