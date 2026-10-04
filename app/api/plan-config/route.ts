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
    incoming.launchMode=incoming.launchMode==="MONETIZED"?"MONETIZED":"FREE_ALL";
    incoming.standaloneProducts=Array.isArray(incoming.standaloneProducts)?incoming.standaloneProducts:[];
    incoming.adSettings={enabled:incoming.adSettings?.enabled!==false,freePlans:Array.isArray(incoming.adSettings?.freePlans)?incoming.adSettings.freePlans.filter((p:string)=>PLAN_NAMES.includes(p as any)):["Basic"],frequency:Math.max(1,Number(incoming.adSettings?.frequency)||10),placement:"DISCOVERY_AFTER_N_PROFILES"};
    incoming.bundles=Array.isArray(incoming.bundles)?incoming.bundles:[];
    incoming.experiences=Array.isArray(incoming.experiences)?incoming.experiences.map((e:any)=>({id:String(e.id||"").trim(),name:String(e.name||"").trim().slice(0,120),type:e.type==="ACTIVITY"?"ACTIVITY":"GAME",featureKey:String(e.featureKey||"").trim(),plans:Array.isArray(e.plans)?e.plans.filter((p:string)=>PLAN_NAMES.includes(p as any)):[],spectatorPlans:Array.isArray(e.spectatorPlans)?e.spectatorPlans.filter((p:string)=>PLAN_NAMES.includes(p as any)):[],audience:Array.isArray(e.audience)?e.audience.filter((a:string)=>a==="ALL"||a==="FEMALE"):["ALL"],dailyLimit:e.dailyLimit?Math.max(1,Number(e.dailyLimit)||1):undefined,enabled:e.enabled!==false,priority:e.priority?Math.max(0,Number(e.priority)||0):undefined})).filter((e:any)=>e.id&&e.name&&e.featureKey):[];
    incoming.features=incoming.features.map((f:any)=>({
      key:String(f.key||"").trim().toLowerCase().replace(/[^a-z0-9_]/g,"_"),
      name:String(f.name||"").trim().slice(0,120),
      description:String(f.description||"").trim().slice(0,300),
      plans:Array.isArray(f.plans)?f.plans.filter((p:string)=>PLAN_NAMES.includes(p as any)):[]
    })).filter((f:any)=>f.key&&f.name&&!seen.has(f.key)&&seen.add(f.key));
    incoming.standaloneProducts=incoming.standaloneProducts.map((p:any)=>({id:String(p.id||"").trim(),name:String(p.name||"").trim().slice(0,120),description:String(p.description||"").trim().slice(0,300),featureKey:String(p.featureKey||"").trim(),audience:Array.isArray(p.audience)?p.audience.filter((a:string)=>a==="ALL"||a==="FEMALE"):["ALL"],billing:["ONE_TIME","MONTHLY","WEEKLY"].includes(p.billing)?p.billing:"ONE_TIME",quantity:Math.max(1,Number(p.quantity)||1),price:Math.max(0,Number(p.price)||0),validityDays:p.validityDays?Math.max(1,Number(p.validityDays)||1):undefined,enabled:p.enabled!==false})).filter((p:any)=>p.id&&p.name&&p.featureKey);
    incoming.bundles=incoming.bundles.map((b:any)=>({id:String(b.id||"").trim(),name:String(b.name||"").trim().slice(0,120),description:String(b.description||"").trim().slice(0,300),audience:Array.isArray(b.audience)?b.audience.filter((a:string)=>a==="ALL"||a==="FEMALE"):["ALL"],billing:["ONE_TIME","MONTHLY","WEEKLY"].includes(b.billing)?b.billing:"ONE_TIME",price:Math.max(0,Number(b.price)||0),validityDays:b.validityDays?Math.max(1,Number(b.validityDays)||1):undefined,enabled:b.enabled!==false,items:Array.isArray(b.items)?b.items.map((i:any)=>({featureKey:String(i.featureKey||"").trim(),quantity:Math.max(1,Number(i.quantity)||1)})).filter((i:any)=>i.featureKey):[]})).filter((b:any)=>b.id&&b.name&&b.items.length);
    await ensurePlanConfigSchema();
    const db=getDb();
    await db.execute(sql`UPDATE plan_config SET config=${JSON.stringify(incoming)}::jsonb,updated_at=now() WHERE id=1`);
    return NextResponse.json({ok:true,config:incoming});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:"Could not save plan configuration."},{status:500});
  }
}
