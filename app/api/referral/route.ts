import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getCurrentUser, requireAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { ensureRewardsSchema } from "../../../lib/rewards";

function makeCode(){return "CUDDL-"+randomBytes(4).toString("hex").toUpperCase();}
export async function GET(){
  await ensureRewardsSchema();
  const current=await getCurrentUser(); if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const db=getDb();
  let rows=await db.execute(sql`SELECT code FROM referral_codes WHERE user_id=${current.user.id} LIMIT 1`);
  let code=(rows as any).rows?.[0]?.code;
  if(!code){code=makeCode(); await db.execute(sql`INSERT INTO referral_codes(user_id,code) VALUES(${current.user.id},${code}) ON CONFLICT(user_id) DO NOTHING`); rows=await db.execute(sql`SELECT code FROM referral_codes WHERE user_id=${current.user.id} LIMIT 1`); code=(rows as any).rows?.[0]?.code||code;}
  const refs=await db.execute(sql`SELECT status,COUNT(*)::int AS count FROM referrals WHERE referrer_id=${current.user.id} GROUP BY status`);
  const rewards=await db.execute(sql`SELECT reward_type,reward_value,status,created_at FROM reward_ledger WHERE user_id=${current.user.id} ORDER BY created_at DESC LIMIT 20`);
  const setting=await db.execute(sql`SELECT enabled,reward_type,reward_value,qualification_event,max_rewards_per_user FROM referral_settings WHERE id=1`);
  return NextResponse.json({code,referralLink:"/?ref="+encodeURIComponent(code),stats:(refs as any).rows||[],rewards:(rewards as any).rows||[],settings:(setting as any).rows?.[0]||null});
}
export async function POST(request:Request){
  await ensureRewardsSchema();
  const current=await getCurrentUser(); if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const body=await request.json(); const code=String(body.code||"").trim().toUpperCase(); if(!code)return NextResponse.json({error:"Referral code required."},{status:400});
  const db=getDb();
  const owner=await db.execute(sql`SELECT user_id FROM referral_codes WHERE code=${code} LIMIT 1`);
  const referrer=(owner as any).rows?.[0]?.user_id;
  if(!referrer)return NextResponse.json({error:"Referral code not found."},{status:404});
  if(referrer===current.user.id)return NextResponse.json({error:"You cannot refer yourself."},{status:400});
  await db.execute(sql`INSERT INTO referrals(referrer_id,referred_id,referral_code) VALUES(${referrer},${current.user.id},${code}) ON CONFLICT(referred_id) DO NOTHING`);
  return NextResponse.json({ok:true});
}
export async function PATCH(request:Request){
  await ensureRewardsSchema();
  const admin=await requireAdmin(); if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  const body=await request.json(); const action=String(body.action||"");
  const db=getDb();
  if(action==="settings"){
    await db.execute(sql`UPDATE referral_settings SET enabled=${!!body.enabled},reward_type=${String(body.rewardType||"PLAN_EXTENSION")},reward_value=${JSON.stringify(body.rewardValue||{})}::jsonb,qualification_event=${String(body.qualificationEvent||"PROFILE_COMPLETE")},max_rewards_per_user=${Math.max(1,Number(body.maxRewardsPerUser)||20)},updated_at=now() WHERE id=1`);
    return NextResponse.json({ok:true});
  }
  if(action==="qualify"){
    const referredId=String(body.referredId||"");
    const row=await db.execute(sql`SELECT r.id,r.referrer_id,s.reward_type,s.reward_value,s.max_rewards_per_user FROM referrals r CROSS JOIN referral_settings s WHERE r.referred_id=${referredId} AND r.status='PENDING' AND s.id=1 LIMIT 1`);
    const x=(row as any).rows?.[0]; if(!x)return NextResponse.json({error:"Pending referral not found."},{status:404});
    const count=await db.execute(sql`SELECT COUNT(*)::int AS count FROM reward_ledger WHERE user_id=${x.referrer_id} AND source_type='REFERRAL' AND status='CREDITED'`);
    if(Number((count as any).rows?.[0]?.count||0)>=Number(x.max_rewards_per_user))return NextResponse.json({error:"Referral reward cap reached."},{status:400});
    await db.execute(sql`UPDATE referrals SET status='REWARDED',qualification_event=${String(body.event||"ADMIN_APPROVED")},qualified_at=now() WHERE id=${x.id}`);
    await db.execute(sql`INSERT INTO reward_ledger(user_id,source_type,source_id,reward_type,reward_value,status) VALUES(${x.referrer_id},'REFERRAL',${x.id},${x.reward_type},${JSON.stringify(x.reward_value||{})}::jsonb,'CREDITED')`);
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Unknown admin action."},{status:400});
}