import { sql } from "drizzle-orm";
import { getDb } from "./db";

export const PLAN_NAMES = ["Basic","Plus","Pro","Premium"] as const;
export type PlanName = typeof PLAN_NAMES[number];

export type PlanConfig = {
  plans: Record<PlanName,{prices:Record<string,number>,tag?:string,copy?:string}>;
  features: Array<{key:string,name:string,description:string,plans:PlanName[]}>;
};

export const DEFAULT_PLAN_CONFIG:PlanConfig={
  plans:{
    Basic:{prices:{Monthly:0},tag:"Free",copy:"Core Cuddl experience."},
    Plus:{prices:{Monthly:99,Quarterly:199,"Half-year":399,Annual:599},tag:"From ₹99/month",copy:"More discovery control and entry-level visibility tools."},
    Pro:{prices:{Monthly:149,Quarterly:349,"Half-year":599,Annual:999},tag:"From ₹149/month",copy:"Higher visibility and stronger interaction priority."},
    Premium:{prices:{Monthly:299,Quarterly:799,"Half-year":1499,Annual:2499},tag:"From ₹299/month",copy:"The highest Cuddl visibility, interaction and activity toolkit."}
  },
  features:[
    ["profile","Profile creation & mandatory completion","Create and maintain a complete Cuddl profile",["Basic","Plus","Pro","Premium"]],
    ["discovery","Discovery & core filters","Browse eligible profiles and core discovery filters",["Basic","Plus","Pro","Premium"]],
    ["activities","Activity, game, music & social discovery","Access community discovery experiences",["Basic","Plus","Pro","Premium"]],
    ["sparks","Daily Sparks & mutual Match","Send/receive core Sparks and form Matches",["Basic","Plus","Pro","Premium"]],
    ["chat","Matches & secure chat","Chat after a Match",["Basic","Plus","Pro","Premium"]],
    ["safety","Safety, report, block & privacy","Core safety and privacy controls",["Basic","Plus","Pro","Premium"]],
    ["identity_check","Identity-check flow","Available identity verification flow",["Basic","Plus","Pro","Premium"]],
    ["standard_priority","Standard discovery priority","Standard placement",["Basic","Plus","Pro","Premium"]],
    ["advanced_filters","Advanced search & discovery filters","Expanded discovery controls",["Plus","Pro","Premium"]],
    ["rewind","Profile Revisit / Rewind","Revisit or rewind profiles",["Plus","Pro","Premium"]],
    ["who_sparked_limited","Who Sparked You — limited","Limited incoming Spark visibility",["Plus","Pro","Premium"]],
    ["paid_activity_access","More activity/game access","Expanded activity and game access",["Plus","Pro","Premium"]],
    ["super_spark","Super Sparks","Higher-visibility interest signal",["Plus","Pro","Premium"]],
    ["boost","Boost","Temporary discovery exposure boost",["Plus","Pro","Premium"]],
    ["priority_placement","Paid-plan priority placement","Higher placement for eligible actions",["Plus","Pro","Premium"]],
    ["pre_match_message","Pre-match messages","Message with a Spark before mutual Match",["Pro","Premium"]],
    ["who_sparked_full","Full Who Sparked You","Full incoming Spark visibility",["Pro","Premium"]],
    ["compatibility","Advanced compatibility insights","Expanded compatibility information",["Pro","Premium"]],
    ["incognito","Incognito discovery","Reduce visibility until interaction",["Pro","Premium"]],
    ["unlimited_revisit","Unlimited profile revisits","Unlimited revisit access",["Pro","Premium"]],
    ["priority_activities","Priority activity access","Priority access to eligible activities",["Pro","Premium"]],
    ["travel_mode","Travel Mode & premium discovery","Premium discovery controls",["Premium"]],
    ["premium_rooms","Premium activity & game rooms","Premium rooms and experiences",["Premium"]],
    ["date_tools","Premium date tools","Advanced date planning tools",["Premium"]],
    ["private_albums","Private albums / enhanced privacy","Enhanced media privacy controls",["Premium"]],
    ["advanced_connections","Advanced Connection features","Advanced connection tools",["Premium"]],
    ["message_bottle","Message in a Bottle","Send a message/media bottle",["Pro","Premium"]]
  ].map(([key,name,description,plans])=>({key,name,description,plans:plans as PlanName[]})) 
};

let ready:Promise<void>|null=null;
export async function ensurePlanConfigSchema(){
  if(ready)return ready;
  ready=(async()=>{
    const db=getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS plan_config (
      id integer PRIMARY KEY DEFAULT 1,
      config jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`INSERT INTO plan_config(id,config) VALUES(1,${JSON.stringify(DEFAULT_PLAN_CONFIG)}::jsonb)
      ON CONFLICT(id) DO NOTHING`);
  })();
  ready=ready.catch(e=>{ready=null;throw e});
  return ready;
}
export async function getPlanConfig():Promise<PlanConfig>{
  await ensurePlanConfigSchema();
  const db=getDb();
  const q=await db.execute(sql`SELECT config FROM plan_config WHERE id=1`);
  const c=(q as any).rows?.[0]?.config;
  return c||DEFAULT_PLAN_CONFIG;
}
export function normalizePlan(value:unknown):PlanName{
  const p=String(value||"Basic").toLowerCase();
  return p==="premium"?"Premium":p==="pro"?"Pro":p==="plus"?"Plus":"Basic";
}
export async function hasPlanFeature(plan:unknown,key:string){
  const config=await getPlanConfig();
  const p=normalizePlan(plan);
  return config.features.some(f=>f.key===key&&f.plans.includes(p));
}
