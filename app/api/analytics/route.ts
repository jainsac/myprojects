import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { sql } from "drizzle-orm";
import { ensureMonetizationSchema, recordMonetizationEvent } from "../../../lib/monetization";

function rangeSql(searchParams:URLSearchParams){
  const preset=String(searchParams.get("range")||"all").toLowerCase();
  const from=searchParams.get("from");
  const to=searchParams.get("to");
  if(from){
    const end=to ? to+" 23:59:59.999" : from+" 23:59:59.999";
    return sql`created_at >= ${from+" 00:00:00"}::timestamp AND created_at <= ${end}::timestamp`;
  }
  if(preset==="today") return sql`created_at >= CURRENT_DATE`;
  if(preset==="7d"||preset==="7") return sql`created_at >= NOW() - INTERVAL '7 days'`;
  if(preset==="30d"||preset==="30") return sql`created_at >= NOW() - INTERVAL '30 days'`;
  if(preset==="90d"||preset==="90") return sql`created_at >= NOW() - INTERVAL '90 days'`;
  return sql`TRUE`;
}
export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{const body=await request.json();const event=String(body.event||"").trim().slice(0,80);const feature=body.featureKey?String(body.featureKey).trim().slice(0,80):undefined;if(!event)return NextResponse.json({error:"Event is required."},{status:400});await recordMonetizationEvent(current.user.id,event,feature,body.productId?String(body.productId):undefined,body.metadata&&typeof body.metadata==="object"?body.metadata:{});return NextResponse.json({ok:true});}catch(e){console.error(e);return NextResponse.json({error:"Could not record event."},{status:500});}
}
export async function GET(request:Request){
  const admin=await requireAdmin();if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  await ensureMonetizationSchema();const db=getDb();const where=rangeSql(new URL(request.url).searchParams);
  const totals=await db.execute(sql`SELECT COUNT(*)::int AS events,COUNT(DISTINCT user_id)::int AS users FROM monetization_events WHERE ${where}`);
  const byFeature=await db.execute(sql`SELECT COALESCE(feature_key,'core') AS feature_key,event_name,COUNT(*)::int AS count FROM monetization_events WHERE ${where} GROUP BY 1,2 ORDER BY count DESC LIMIT 200`);
  const byDay=await db.execute(sql`SELECT DATE(created_at) AS day,COUNT(*)::int AS count,COUNT(DISTINCT user_id)::int AS users FROM monetization_events WHERE ${where} GROUP BY 1 ORDER BY day ASC`);
  return NextResponse.json({totals:(totals as any).rows?.[0]||{events:0,users:0},byFeature:(byFeature as any).rows||[],byDay:(byDay as any).rows||[]});
}