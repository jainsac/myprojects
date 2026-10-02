import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { identityVerifications } from "../../../../lib/db/schema";

export async function GET(){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const db=getDb();
  const rows=await db.select().from(identityVerifications).where(eq(identityVerifications.userId,current.user.id)).limit(1);
  if(!rows.length)return NextResponse.json({status:"not_started",providerConfigured:false});
  return NextResponse.json({
    status:rows[0].status,
    provider:rows[0].provider,
    providerConfigured:Boolean(process.env.IDENTITY_PROVIDER_NAME && process.env.IDENTITY_PROVIDER_API_KEY),
    required:["government_id","live_selfie_front","live_selfie_left","live_selfie_right"],
  });
}

export async function POST(){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  if(!process.env.IDENTITY_PROVIDER_NAME || !process.env.IDENTITY_PROVIDER_API_KEY){
    return NextResponse.json({
      error:"Identity provider is not configured yet.",
      setupRequired:["IDENTITY_PROVIDER_NAME","IDENTITY_PROVIDER_API_KEY"],
    },{status:503});
  }
  return NextResponse.json({error:"Provider adapter is ready but the provider-specific SDK/API flow still needs its production credentials and contract."},{status:501});
}
