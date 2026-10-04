import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { sql } from "drizzle-orm";
import { ensureMonetizationSchema, recordMonetizationEvent } from "../../../lib/monetization";

export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const body=await request.json();
    const event=String(body.event||"").trim().slice(0,80);
    const feature=body.featureKey?String(body.featureKey).trim().slice(0,80):undefined;
    if(!event)return NextResponse.json({error:"Event is required."},{status:400});
    await recordMonetizationEvent(current.user.id,event,feature,body.productId?String(body.productId):undefined,body.metadata&&typeof body.metadata==="object"?body.metadata:{});
    return NextResponse.json({ok:true});
  }catch(e){console.error(e);return NextResponse.json({error:"Could not record event."},{status:500});}
}

export async function GET(){
  const admin=await requireAdmin();
  if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  await ensureMonetizationSchema();
  const db=getDb();
  const totals=await db.execute(sql`SELECT COUNT(*)::int AS events,COUNT(DISTINCT user_id)::int AS users FROM monetization_events WHERE TRUE`);
  const byFeature=await db.execute(sql`SELECT COALESCE(feature_key,'core') AS feature_key,event_name,COUNT(*)::int AS count FROM monetization_events WHERE TRUE GROUP BY 1,2 ORDER BY count DESC LIMIT 100`);
  return NextResponse.json({windowDays:null,totals:(totals as any).rows?.[0]||{events:0,users:0},byFeature:(byFeature as any).rows||[]});
}
