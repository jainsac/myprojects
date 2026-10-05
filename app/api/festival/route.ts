import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { activities, festivalActivities, festivals } from "../../../lib/db/schema";

export async function GET(){
  try{
    const current=await getCurrentUser();
    const plan=String((current?.profile?.lifestylePreferences as any)?.plan||"BASIC").toUpperCase();
    const paid=plan==="PLUS"||plan==="PRO"||plan==="PREMIUM";
    const db=getDb();
    let live;
    try {
      live=await db.select().from(festivals).where(eq(festivals.isLive,true)).limit(1);
    }catch(error:any){
      // Festival is an optional module; an older database may not have its tables yet.
      // Do not let that prevent the main app/API from loading.
      if(error?.cause?.code==="42P01" || error?.code==="42P01") return NextResponse.json({live:false,festival:null,activities:[]});
      throw error;
    }
    if(!live.length) return NextResponse.json({live:false,festival:null,activities:[]});
    const festival=live[0];
    if(!paid) return NextResponse.json({live:true,festival:{id:festival.id,name:festival.name,slug:festival.slug,tagline:festival.tagline,description:festival.description,city:festival.city,coverEmoji:festival.coverEmoji,startsAt:festival.startsAt,endsAt:festival.endsAt},activities:[],locked:true,requiredPlan:"PLUS"});
    const rows=await db.select({activity:activities,sortOrder:festivalActivities.sortOrder})
      .from(festivalActivities)
      .innerJoin(activities,eq(activities.id,festivalActivities.activityId))
      .where(eq(festivalActivities.festivalId,festival.id))
      .orderBy(asc(festivalActivities.sortOrder));
    return NextResponse.json({live:true,festival,activities:rows.map(x=>x.activity)});
  }catch(error){console.error(error);return NextResponse.json({live:false,festival:null,activities:[]},{status:500});}
}
