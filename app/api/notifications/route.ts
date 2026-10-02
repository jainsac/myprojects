import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { notifications, notificationReads } from "../../../lib/db/schema";

export async function GET(){
  const current=await getCurrentUser();
  if(!current) return NextResponse.json({authenticated:false,notifications:[]});
  const db=getDb();
  const rows=await db.select().from(notifications).where(eq(notifications.isActive,true));
  const city=current.profile?.city||"";
  const filtered=rows.filter(n=>n.audience==="all" || (n.audience==="active" && current.user.status==="active") || (n.audience==="city" && n.city===city));
  const reads=await db.select({id:notificationReads.notificationId}).from(notificationReads).where(eq(notificationReads.userId,current.user.id));
  const readSet=new Set(reads.map(x=>x.id));
  return NextResponse.json({notifications:filtered.map(n=>({...n,read:readSet.has(n.id)}))});
}

export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current) return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const {id}=await request.json();
    if(!id) return NextResponse.json({error:"Notification id is required."},{status:400});
    const db=getDb();
    await db.insert(notificationReads).values({notificationId:String(id),userId:current.user.id}).onConflictDoNothing();
    return NextResponse.json({ok:true});
  }catch(error){console.error(error);return NextResponse.json({error:"Could not mark notification read."},{status:500});}
}
