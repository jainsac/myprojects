import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getCurrentUser, requireAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { ensureRewardsSchema } from "../../../lib/rewards";

export async function POST(request:Request){
  await ensureRewardsSchema();
  const current=await getCurrentUser(); if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const body=await request.json(); const code=String(body.code||"").trim().toUpperCase(); const plan=String(body.plan||"");
  if(!code)return NextResponse.json({error:"Enter an offer code."},{status:400});
  const db=getDb();
  const q=await db.execute(sql`SELECT * FROM offer_codes WHERE code=${code} AND enabled=true LIMIT 1\`);
  const offer=(q as any).rows?.[0]; if(!offer)return NextResponse.json({error:"Offer code is invalid or inactive."},{status:404});
  const now=new Date();
  if(offer.starts_at && new Date(offer.starts_at)>now)return NextResponse.json({error:"This offer has not started yet."},{status:400});
  if(offer.ends_at && new Date(offer.ends_at)<now)return NextResponse.json({error:"This offer has expired."},{status:400});
  if(offer.max_redemptions!==null && Number(offer.redeemed_count)>=Number(offer.max_redemptions))return NextResponse.json({error:"This offer has reached its redemption limit."},{status:400});
  const plans=Array.isArray(offer.applicable_plans)?offer.applicable_plans:[]; if(plans.length&& !plans.includes(plan))return NextResponse.json({error:"This offer is not valid for the selected plan."},{status:400});
  const used=await db.execute(sql`SELECT COUNT(*)::int AS count FROM offer_redemptions WHERE offer_id=${offer.id} AND user_id=${current.user.id}\`);
  if(Number((used as any).rows?.[0]?.count||0)>=Number(offer.per_user_limit||1))return NextResponse.json({error:"You have already used this offer."},{status:400});
  return NextResponse.json({valid:true,code,discountType:offer.discount_type,discountValue:Number(offer.discount_value),rewardType:offer.reward_type,rewardValue:offer.reward_value,minPurchase:Number(offer.min_purchase||0),offerId:offer.id});
}
export async function PATCH(request:Request){
  await ensureRewardsSchema();
  const admin=await requireAdmin(); if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  const b=await request.json(); const db=getDb();
  const code=String(b.code||"").trim().toUpperCase(); if(!code)return NextResponse.json({error:"Offer code required."},{status:400});
  if(b.action==="toggle"){await db.execute(sql`UPDATE offer_codes SET enabled=${!!b.enabled} WHERE code=${code}\`);return NextResponse.json({ok:true});}
  await db.execute(sql`INSERT INTO offer_codes(code,enabled,discount_type,discount_value,reward_type,reward_value,applicable_plans,max_redemptions,per_user_limit,min_purchase,starts_at,ends_at) VALUES(${code},${b.enabled!==false},${String(b.discountType||"PERCENT")},${Number(b.discountValue)||0},${String(b.rewardType||"DISCOUNT")},${JSON.stringify(b.rewardValue||{})}::jsonb,${JSON.stringify(Array.isArray(b.applicablePlans)?b.applicablePlans:[])}::jsonb,${b.maxRedemptions?Number(b.maxRedemptions):null},${Math.max(1,Number(b.perUserLimit)||1)},${Number(b.minPurchase)||0},${b.startsAt?new Date(b.startsAt):null},${b.endsAt?new Date(b.endsAt):null}) ON CONFLICT(code) DO UPDATE SET enabled=EXCLUDED.enabled,discount_type=EXCLUDED.discount_type,discount_value=EXCLUDED.discount_value,reward_type=EXCLUDED.reward_type,reward_value=EXCLUDED.reward_value,applicable_plans=EXCLUDED.applicable_plans,max_redemptions=EXCLUDED.max_redemptions,per_user_limit=EXCLUDED.per_user_limit,min_purchase=EXCLUDED.min_purchase,starts_at=EXCLUDED.starts_at,ends_at=EXCLUDED.ends_at\`);
  return NextResponse.json({ok:true});
}
export async function GET(){
  await ensureRewardsSchema(); const admin=await requireAdmin(); if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  const db=getDb(); const rows=await db.execute(sql`SELECT id,code,enabled,discount_type,discount_value,reward_type,reward_value,applicable_plans,max_redemptions,per_user_limit,min_purchase,starts_at,ends_at,redeemed_count FROM offer_codes ORDER BY created_at DESC\`);
  return NextResponse.json({offers:(rows as any).rows||[]});
}