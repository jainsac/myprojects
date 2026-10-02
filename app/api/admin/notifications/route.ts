import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { notifications } from "../../../../lib/db/schema";

export async function GET(){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  const db=getDb();
  return NextResponse.json({notifications:await db.select().from(notifications).orderBy(desc(notifications.createdAt))});
}

export async function POST(request:Request){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  try{
    const body=await request.json();
    const title=String(body.title||"").trim(), text=String(body.body||"").trim();
    if(!title||!text) return NextResponse.json({error:"Title and message are required."},{status:400});
    const db=getDb();
    const [created]=await db.insert(notifications).values({
      title,body:text,audience:body.audience==="active"||body.audience==="city"?body.audience:"all",
      city:String(body.city||"").trim()||null,showPopup:body.showPopup!==false,isActive:body.publishNow!==false,publishedAt:new Date()
    }).returning();
    return NextResponse.json({ok:true,notification:created});
  }catch(error){console.error(error);return NextResponse.json({error:"Could not publish notification."},{status:500});}
}

export async function PATCH(request:Request){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  try{
    const {id,isActive}=await request.json();
    const db=getDb();
    await db.update(notifications).set({isActive:Boolean(isActive)}).where(eq(notifications.id,String(id)));
    return NextResponse.json({ok:true});
  }catch(error){console.error(error);return NextResponse.json({error:"Could not update notification."},{status:500});}
}
