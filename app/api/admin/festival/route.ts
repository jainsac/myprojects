import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { activities, festivalActivities, festivals } from "../../../../lib/db/schema";

export async function GET(){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  const db=getDb();
  const all=await db.select().from(festivals);
  const acts=await db.select().from(activities);
  return NextResponse.json({festivals:all,activities:acts});
}

export async function POST(request:Request){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  try{
    const body=await request.json();
    if(body.action==="createActivity"){
      const activityName=String(body.activityName||"").trim();
      if(!activityName) return NextResponse.json({error:"Activity name is required."},{status:400});
      const db=getDb();
      const [activity]=await db.insert(activities).values({
        name:activityName,category:String(body.category||"Festival").trim()||"Festival",
        description:String(body.description||"").trim()||null,city:String(body.city||"").trim()||null,
        capacity:body.capacity?Number(body.capacity):null,isPublic:true
      }).returning();
      return NextResponse.json({ok:true,activity});
    }
    const name=String(body.name||"").trim(), slug=String(body.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,"-")).trim();
    if(!name) return NextResponse.json({error:"Festival name is required."},{status:400});
    const db=getDb();
    const created=await db.insert(festivals).values({
      name,slug,tagline:String(body.tagline||"").trim()||null,description:String(body.description||"").trim()||null,
      city:String(body.city||"").trim()||null,coverEmoji:String(body.coverEmoji||"🎉"),isLive:false
    }).returning();
    const ids=Array.isArray(body.activityIds)?body.activityIds.map(String).filter(Boolean):[];
    if(ids.length) await db.insert(festivalActivities).values(ids.map((activityId:string,i:number)=>({festivalId:created[0].id,activityId,sortOrder:i}))).onConflictDoNothing();
    return NextResponse.json({ok:true,festival:created[0]});
  }catch(error){console.error(error);return NextResponse.json({error:"Could not create festival."},{status:500});}
}

export async function PATCH(request:Request){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  try{
    const body=await request.json();
    const id=String(body.id||"");
    if(!id) return NextResponse.json({error:"Festival id is required."},{status:400});
    const db=getDb();
    if(body.action==="toggle"){
      const row=await db.select().from(festivals).where(eq(festivals.id,id)).limit(1);
      if(!row.length) return NextResponse.json({error:"Festival not found."},{status:404});
      if(!row[0].isLive) await db.update(festivals).set({isLive:false});
      await db.update(festivals).set({isLive:!row[0].isLive}).where(eq(festivals.id,id));
    } else if(body.action==="activities"){
      const ids=Array.isArray(body.activityIds)?body.activityIds.map(String):[];
      await db.delete(festivalActivities).where(eq(festivalActivities.festivalId,id));
      if(ids.length) await db.insert(festivalActivities).values(ids.map((activityId:string,i:number)=>({festivalId:id,activityId,sortOrder:i})));
    }
    return NextResponse.json({ok:true});
  }catch(error){console.error(error);return NextResponse.json({error:"Could not update festival."},{status:500});}
}
