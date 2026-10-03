import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
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
    const lifestylePreferences={...existing,gender:gender||undefined,desiredGender:desiredGender||undefined};
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
    return NextResponse.json({ok:true,profile});
  }catch(error){console.error(error);return NextResponse.json({error:"Profile update failed."},{status:500});}
}
