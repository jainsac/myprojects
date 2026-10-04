import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { sql } from "drizzle-orm";

async function ensureSchema(){
  const db=getDb();
  await db.execute(sql`CREATE TABLE IF NOT EXISTS user_feedback (
    id bigserial PRIMARY KEY,
    user_id text NOT NULL,
    type text NOT NULL DEFAULT 'FEEDBACK',
    category text NOT NULL DEFAULT 'GENERAL',
    subject text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'OPEN',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
}
export async function POST(request:Request){
  const current=await getCurrentUser();if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    await ensureSchema();const body=await request.json();
    const type=String(body.type||"FEEDBACK").toUpperCase().slice(0,30);
    const category=String(body.category||"GENERAL").slice(0,50);
    const subject=String(body.subject||"").trim().slice(0,160);
    const message=String(body.message||"").trim().slice(0,5000);
    if(message.length<5)return NextResponse.json({error:"Please describe the issue or feedback."},{status:400});
    const db=getDb();
    await db.execute(sql`INSERT INTO user_feedback(user_id,type,category,subject,message) VALUES(${current.user.id},${type},${category},${subject||null},${message})`);
    return NextResponse.json({ok:true});
  }catch(e){console.error(e);return NextResponse.json({error:"Could not submit your request."},{status:500});}
}
export async function GET(){
  const admin=await requireAdmin();if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  await ensureSchema();const db=getDb();
  const q=await db.execute(sql`SELECT id,user_id,type,category,subject,message,status,created_at,updated_at FROM user_feedback ORDER BY created_at DESC LIMIT 200`);
  return NextResponse.json({feedback:(q as any).rows||[]});
}
export async function PATCH(request:Request){
  const admin=await requireAdmin();if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  await ensureSchema();const body=await request.json();const id=Number(body.id);const status=String(body.status||"OPEN").toUpperCase();
  if(!id||!["OPEN","IN_REVIEW","RESOLVED","CLOSED"].includes(status))return NextResponse.json({error:"Invalid feedback update."},{status:400});
  const db=getDb();await db.execute(sql`UPDATE user_feedback SET status=${status},updated_at=now() WHERE id=${id}`);
  return NextResponse.json({ok:true});
}