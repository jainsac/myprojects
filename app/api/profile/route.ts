import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { ensureRewardsSchema } from "../../../lib/rewards";
import { profiles } from "../../../lib/db/schema";

const genders = ["MALE","FEMALE","NON_BINARY","OTHER"];
const desiredGenders = ["MALE","FEMALE","NON_BINARY","OTHER","ANY"];

export async function PUT(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const body=await request.json();
    const displayName=String(body.displayName??current.profile?.displayName??"").trim();
    if(!displayName)return NextResponse.json({error:"Display name is required."},{status:400});
    const existing=(current.profile?.lifestylePreferences||{}) as Record<string,unknown>;
    const gender=body.gender===undefined?String(existing.gender||""):String(body.gender||"").trim().toUpperCase();
    const desiredGender=body.desiredGender===undefined?String(existing.desiredGender||""):String(body.desiredGender||"").trim().toUpperCase();
    if(gender && !genders.includes(gender))return NextResponse.json({error:"Invalid gender selection."},{status:400});
    if(desiredGender && !desiredGenders.includes(desiredGender))return NextResponse.json({error:"Invalid discovery preference."},{status:400});
    const lifestylePreferences={
      ...existing,
      gender:gender||undefined,
      desiredGender:desiredGender||undefined,
      state:body.state===undefined?existing.state:String(body.state||"").trim()||undefined,
      maritalStatus:body.maritalStatus===undefined?existing.maritalStatus:String(body.maritalStatus||"").trim().toUpperCase()||undefined,
      personalityPrompts:body.personalityPrompts===undefined?existing.personalityPrompts:Array.isArray(body.personalityPrompts)?body.personalityPrompts.filter((x:any)=>x?.question&&x?.answer).slice(0,3):existing.personalityPrompts,
      partnerPrompts:body.partnerPrompts===undefined?existing.partnerPrompts:Array.isArray(body.partnerPrompts)?body.partnerPrompts.filter((x:any)=>x?.question&&x?.answer).slice(0,3):existing.partnerPrompts,
      profileShowcase:body.profileShowcase===undefined?existing.profileShowcase:Array.isArray(body.profileShowcase)?body.profileShowcase.filter((x:any)=>x?.kind&&x?.pathname).slice(0,8):existing.profileShowcase,
      personalityStickers:body.personalityStickers===undefined?existing.personalityStickers:Array.isArray(body.personalityStickers)?body.personalityStickers.map(String).slice(0,8):existing.personalityStickers,
      foodPreference:body.foodPreference===undefined?existing.foodPreference:String(body.foodPreference||"").trim()||undefined,
      food:body.food===undefined?existing.food:String(body.food||"").trim()||undefined,
      diet:body.diet===undefined?existing.diet:String(body.diet||"").trim()||undefined,
      smoking:body.smoking===undefined?existing.smoking:String(body.smoking||"").trim()||undefined,
      drinking:body.drinking===undefined?existing.drinking:String(body.drinking||"").trim()||undefined,
      relationshipGoal:body.relationshipGoal===undefined?existing.relationshipGoal:String(body.relationshipGoal||"").trim()||undefined,
      education:body.education===undefined?existing.education:String(body.education||"").trim()||undefined,
      qualification:body.qualification===undefined?existing.qualification:String(body.qualification||"").trim()||undefined,
      children:body.children===undefined?existing.children:String(body.children||"").trim()||undefined,
      pets:body.pets===undefined?existing.pets:String(body.pets||"").trim()||undefined,
      exercise:body.exercise===undefined?existing.exercise:String(body.exercise||"").trim()||undefined,
      language:body.language===undefined?existing.language:String(body.language||"").trim()||undefined,
      heightCm:body.heightCm===undefined?existing.heightCm:Number(body.heightCm)||undefined,
      verified:body.verified===undefined?existing.verified:!!body.verified,
      photos:body.photos===undefined?existing.photos:Array.isArray(body.photos)?body.photos.map(String):existing.photos,
      company:body.company===undefined?existing.company:String(body.company||"").trim()||undefined,
      profession:body.profession===undefined?existing.profession:String(body.profession||"").trim()||undefined,
      religion:body.religion===undefined?existing.religion:String(body.religion||"").trim()||undefined,
      community:body.community===undefined?existing.community:String(body.community||"").trim()||undefined,
      locationLatitude:body.locationLatitude===undefined?existing.locationLatitude:Number(body.locationLatitude)||undefined,
      locationLongitude:body.locationLongitude===undefined?existing.locationLongitude:Number(body.locationLongitude)||undefined,
      locationAccuracy:body.locationAccuracy===undefined?existing.locationAccuracy:Number(body.locationAccuracy)||undefined,
      locationGranted:body.locationGranted===undefined?existing.locationGranted:!!body.locationGranted,
      locationUpdatedAt:body.locationGranted===true?new Date().toISOString():existing.locationUpdatedAt,
    };
    const db=getDb();
    const [profile]=await db.update(profiles).set({
      displayName,
      city:body.city===undefined?current.profile?.city??null:String(body.city).trim()||null,
      bio:body.bio===undefined?current.profile?.bio??null:String(body.bio).trim()||null,
      communicationStyle:body.communicationStyle===undefined?current.profile?.communicationStyle??null:String(body.communicationStyle).trim()||null,
      relationshipGoals:Array.isArray(body.relationshipGoals)?body.relationshipGoals.map(String):current.profile?.relationshipGoals??[],
      lifestylePreferences,
      updatedAt:new Date(),
    }).where(eq(profiles.userId,current.user.id)).returning();
    try{
      const complete=!!profile.displayName && !!profile.city && !!(lifestylePreferences as any).state && !!(lifestylePreferences as any).gender && !!(lifestylePreferences as any).desiredGender && String(profile.bio||"").trim().length>=10 && !!(lifestylePreferences as any).maritalStatus;
      if(complete){
        await ensureRewardsSchema();
        const settings=await db.execute((await import("drizzle-orm")).sql`SELECT qualification_event,reward_type,reward_value,max_rewards_per_user,enabled FROM referral_settings WHERE id=1`);
        const s=(settings as any).rows?.[0];
        if(s?.enabled && s.qualification_event==="PROFILE_COMPLETE"){
          const pending=await db.execute((await import("drizzle-orm")).sql`SELECT r.id,r.referrer_id,s.reward_type,s.reward_value,s.max_rewards_per_user FROM referrals r CROSS JOIN referral_settings s WHERE r.referred_id=${current.user.id} AND r.status='PENDING' AND s.id=1 LIMIT 1`);
          const x=(pending as any).rows?.[0];
          if(x){
            const count=await db.execute((await import("drizzle-orm")).sql`SELECT COUNT(*)::int AS count FROM reward_ledger WHERE user_id=${x.referrer_id} AND source_type='REFERRAL' AND status='CREDITED'`);
            if(Number((count as any).rows?.[0]?.count||0)<Number(x.max_rewards_per_user)){
              await db.execute((await import("drizzle-orm")).sql`UPDATE referrals SET status='REWARDED',qualification_event='PROFILE_COMPLETE',qualified_at=now() WHERE id=${x.id}`);
              await db.execute((await import("drizzle-orm")).sql`INSERT INTO reward_ledger(user_id,source_type,source_id,reward_type,reward_value,status) VALUES(${x.referrer_id},'REFERRAL',${x.id},${x.reward_type},${JSON.stringify(x.reward_value||{})}::jsonb,'CREDITED')`);
            }
          }
        }
      }
    }catch(rewardError){console.error("Referral qualification error",rewardError);}
    return NextResponse.json({ok:true,profile});
  }catch(error){console.error(error);return NextResponse.json({error:"Profile update failed."},{status:500});}
}
