import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { ensureRewardsSchema } from "../../../lib/rewards";

export async function GET(){
  await ensureRewardsSchema();
  const current=await getCurrentUser(); if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const db=getDb();
  await db.execute(sql`UPDATE bottles SET status='EXPIRED',opened_at=COALESCE(opened_at,now()),opened_action='EXPIRED' WHERE status='ACTIVE' AND expires_at IS NOT NULL AND expires_at<=now()`);
  const settings=await db.execute(sql`SELECT * FROM bottle_settings WHERE id=1`);
  const s=(settings as any).rows?.[0]||{pro_monthly_limit:2,premium_monthly_limit:5,open_timeout_days:30};
  const plan=String((current.profile?.lifestylePreferences as any)?.plan||"BASIC").toUpperCase();
  const ent=plan==="PREMIUM"?"PREMIUM":plan==="PRO"?"PRO":"BASIC";
  const active=await db.execute(sql`SELECT id,status,created_at,opened_at FROM bottles WHERE sender_id=${current.user.id} AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1`);
  const month=await db.execute(sql`SELECT COUNT(*)::int AS count FROM bottles WHERE sender_id=${current.user.id} AND created_at>=date_trunc('month',now())`);
  const opened=await db.execute(sql`SELECT id,sender_id,content_text,media,status,created_at,opened_at FROM bottles WHERE receiver_id=${current.user.id} AND status='OPENED' ORDER BY opened_at DESC LIMIT 20`);
  const incoming=await db.execute(sql`SELECT id,sender_id,content_text,media,status,created_at,expires_at FROM bottles WHERE receiver_id=${current.user.id} AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1`);
  return NextResponse.json({plan:ent,limits:{PRO:Number(s.pro_monthly_limit),PREMIUM:Number(s.premium_monthly_limit)},usedThisMonth:Number((month as any).rows?.[0]?.count||0),active:(active as any).rows?.[0]||null,incoming:(incoming as any).rows?.[0]||null,opened:(opened as any).rows||[],settings:{openTimeoutDays:Number(s.open_timeout_days||30)}});
}
export async function POST(request:Request){
  await ensureRewardsSchema();
  const current=await getCurrentUser(); if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const body=await request.json(); const db=getDb();
  await db.execute(sql`UPDATE bottles SET status='EXPIRED',opened_at=COALESCE(opened_at,now()),opened_action='EXPIRED' WHERE status='ACTIVE' AND expires_at IS NOT NULL AND expires_at<=now()`);
  const plan=String((current.profile?.lifestylePreferences as any)?.plan||"BASIC").toUpperCase();
  if(plan!=="PRO"&&plan!=="PREMIUM")return NextResponse.json({error:"Message in a Bottle is available on Pro and Premium plans."},{status:403});
  const settings=await db.execute(sql`SELECT * FROM bottle_settings WHERE id=1`); const s=(settings as any).rows?.[0];
  const limit=plan==="PREMIUM"?Number(s?.premium_monthly_limit||5):Number(s?.pro_monthly_limit||2);
  const count=await db.execute(sql`SELECT COUNT(*)::int AS count FROM bottles WHERE sender_id=${current.user.id} AND created_at>=date_trunc('month',now())`);
  if(Number((count as any).rows?.[0]?.count||0)>=limit)return NextResponse.json({error:"Your monthly bottle limit has been reached."},{status:400});
  const active=await db.execute(sql`SELECT id FROM bottles WHERE sender_id=${current.user.id} AND status='ACTIVE' LIMIT 1`);
  if((active as any).rows?.length)return NextResponse.json({error:"You already have one active bottle. Wait until it is opened before throwing another."},{status:400});
  const text=String(body.text||"").trim(); const media=Array.isArray(body.media)?body.media.slice(0,10):[];
  if(!text&&!media.length)return NextResponse.json({error:"Add a message or at least one bottle media item."},{status:400});
  const row=await db.execute(sql`SELECT id FROM users WHERE id<>${current.user.id} AND status='active' AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id=${current.user.id}) AND id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id=${current.user.id}) ORDER BY random() LIMIT 1`);
  const receiver=(row as any).rows?.[0]?.id;
  if(!receiver)return NextResponse.json({error:"No eligible bottle recipient is available right now."},{status:409});
  const created=await db.execute(sql`INSERT INTO bottles(sender_id,receiver_id,content_text,media,status,expires_at) VALUES(${current.user.id},${receiver},${text||null},${JSON.stringify(media)}::jsonb,'ACTIVE',now()+make_interval(days=>${Number(s?.open_timeout_days||30)})) RETURNING id,status,created_at,expires_at`);
  await db.execute(sql`INSERT INTO notifications(title,body,audience,target_user_id,show_popup,is_active,published_at) VALUES('🌊 You found a Cuddl bottle','Someone sent you a Message in a Bottle. Open it to discover their story.','all',${receiver},false,true,now())`);
  return NextResponse.json({ok:true,bottle:(created as any).rows?.[0]});
}
export async function PATCH(request:Request){
  await ensureRewardsSchema();
  const current=await getCurrentUser(); if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const body=await request.json(); const action=String(body.action||""); const id=String(body.id||""); const db=getDb();
  const q=await db.execute(sql`SELECT * FROM bottles WHERE id=${id} AND receiver_id=${current.user.id} AND status='ACTIVE' LIMIT 1`);
  const bottle=(q as any).rows?.[0]; if(!bottle)return NextResponse.json({error:"Bottle is unavailable or already opened."},{status:404});
  if(action==="open"){
    await db.execute(sql`UPDATE bottles SET status='OPENED',opened_at=now(),opened_action='OPENED' WHERE id=${id}`);
    return NextResponse.json({ok:true,bottle:{id:bottle.id,senderId:bottle.sender_id,text:bottle.content_text,media:bottle.media||[]},message:"Bottle opened. You can decide whether to connect."});
  }
  if(action==="connect"){
    await db.execute(sql`UPDATE bottles SET status='OPENED',opened_at=COALESCE(opened_at,now()),opened_action='CONNECT',connection_requested=true WHERE id=${id}`);
    await db.execute(sql`INSERT INTO sparks(from_user_id,to_user_id,status,message) VALUES(${current.user.id},${bottle.sender_id},'pending','Message in a Bottle connection request')`);
    return NextResponse.json({ok:true,connected:true});
  }
  if(action==="pass"||action==="report"){
    await db.execute(sql`UPDATE bottles SET status='OPENED',opened_at=now(),opened_action=${action.toUpperCase()} WHERE id=${id}`);
    if(action==="report")await db.execute(sql`INSERT INTO reports(reporter_id,reported_user_id,category,details) VALUES(${current.user.id},${bottle.sender_id},'bottle','Reported Message in a Bottle')`);
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Unknown bottle action."},{status:400});
}