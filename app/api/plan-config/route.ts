import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth";
import { getPlanConfig, ensurePlanConfigSchema, PLAN_NAMES } from "../../../lib/plan-config";
import { getDb } from "../../../lib/db";
import { sql } from "drizzle-orm";

export async function GET(){ return NextResponse.json(await getPlanConfig()); }

export async function PATCH(request:Request){
  const admin=await requireAdmin();
  if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  try{
    const body=await request.json();
    const incoming=body.config;
    if(!incoming?.plans||!Array.isArray(incoming.features))return NextResponse.json({error:"Invalid plan configuration."},{status:400});
    for(const p of PLAN_NAMES){
      if(!incoming.plans[p]?.prices)return NextResponse.json({error:"Missing pricing for "+p+"."},{status:400});
      for(const value of Object.values(incoming.plans[p].prices)){
        if(!Number.isFinite(Number(value))||Number(value)<0)return NextResponse.json({error:"Invalid price for "+p+"."},{status:400});
      }
    }
    const seen=new Set<string>();
    incoming.features=incoming.features.map((f:any)=>({
      key:String(f.key||"").trim().toLowerCase().replace(/[^a-z0-9_]/g,"_"),
      name:String(f.name||"").trim().slice(0,120),
      description:String(f.description||"").trim().slice(0,300),
      plans:Array.isArray(f.plans)?f.plans.filter((p:string)=>PLAN_NAMES.includes(p as any)):[]
    })).filter((f:any)=>f.key&&f.name&&!seen.has(f.key)&&seen.add(f.key));
    await ensurePlanConfigSchema();
    const db=getDb();
    await db.execute(sql`UPDATE plan_config SET config=${JSON.stringify(incoming)}::jsonb,updated_at=now() WHERE id=1`);
    return NextResponse.json({ok:true,config:incoming});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:"Could not save plan configuration."},{status:500});
  }
}
