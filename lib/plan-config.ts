import { sql } from "drizzle-orm";
import { getDb } from "./db";

export const PLAN_NAMES = ["Basic","Plus","Pro","Premium"] as const;
export type PlanName = typeof PLAN_NAMES[number];

export type Audience = "ALL" | "FEMALE";
export type StandaloneProduct = { id:string; name:string; description:string; featureKey:string; audience:Audience[]; billing:"ONE_TIME"|"MONTHLY"|"WEEKLY"; quantity:number; price:number; validityDays?:number; enabled:boolean; };
export type FeatureBundle = { id:string; name:string; description:string; audience:Audience[]; billing:"ONE_TIME"|"MONTHLY"|"WEEKLY"; price:number; validityDays?:number; enabled:boolean; items:Array<{featureKey:string,quantity:number}>; };\nexport type ExperienceAccess = "PLAY"|"SPECTATE";\nexport type ExperienceConfig = { id:string; name:string; type:"GAME"|"ACTIVITY"; featureKey:string; plans:PlanName[]; spectatorPlans:PlanName[]; audience:Audience[]; dailyLimit?:number; enabled:boolean; priority?:number; };
export type PlanConfig = {
  launchMode:"FREE_ALL"|"MONETIZED";
  plans: Record<PlanName,{prices:Record<string,number>,tag?:string,copy?:string}>;
  features: Array<{key:string,name:string,description:string,plans:PlanName[],audience:Audience[]}>;
  standaloneProducts:StandaloneProduct[];
  bundles:FeatureBundle[];
  adSettings:{enabled:boolean;freePlans:PlanName[];frequency:number;placement:"DISCOVERY_AFTER_N_PROFILES"};\n  experiences: ExperienceConfig[];
};

export const DEFAULT_PLAN_CONFIG:PlanConfig={
  plans:{
    Basic:{prices:{Monthly:0},tag:"Free",copy:"Core Cuddl experience."},
    Plus:{prices:{Monthly:99,Quarterly:199,"Half-year":399,Annual:599},tag:"From ₹99/month",copy:"More discovery control and entry-level visibility tools."},
    Pro:{prices:{Monthly:149,Quarterly:349,"Half-year":599,Annual:999},tag:"From ₹149/month",copy:"Higher visibility and stronger interaction priority."},
    Premium:{prices:{Monthly:299,Quarterly:799,"Half-year":1499,Annual:2499},tag:"From ₹299/month",copy:"The highest Cuddl visibility, interaction and activity toolkit."}
  },
  launchMode:"FREE_ALL",
  standaloneProducts:[
    {id:"super-spark-10",name:"Super Sparks ×10",description:"10 higher-visibility interest signals.",featureKey:"super_spark",audience:["ALL"],billing:"ONE_TIME",quantity:10,price:49,enabled:true},
    {id:"boost-3",name:"Boost ×3",description:"3 temporary discovery exposure boosts.",featureKey:"boost",audience:["ALL"],billing:"ONE_TIME",quantity:3,price:79,enabled:true},
    {id:"pre-match-5",name:"Pre-match Messages ×5",description:"5 pre-match messages.",featureKey:"pre_match_message",audience:["ALL"],billing:"ONE_TIME",quantity:5,price:99,enabled:true}
  ],
  adSettings:{enabled:true,freePlans:["Basic"],frequency:10,placement:"DISCOVERY_AFTER_N_PROFILES"},
  experiences:[
    {id:"ttt",name:"Tic-Tac-Toe",type:"GAME",featureKey:"paid_activity_access",plans:["Basic","Plus","Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:1},
    {id:"rapid-quiz",name:"Rapid Quiz",type:"GAME",featureKey:"paid_activity_access",plans:["Basic","Plus","Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:1},
    {id:"ludo",name:"Ludo After Work",type:"GAME",featureKey:"paid_activity_access",plans:["Plus","Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],dailyLimit:3,enabled:true,priority:2},
    {id:"memory",name:"Memory Match",type:"GAME",featureKey:"paid_activity_access",plans:["Plus","Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],dailyLimit:3,enabled:true,priority:2},
    {id:"chess",name:"Chess Café",type:"GAME",featureKey:"premium_rooms",plans:["Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:3},
    {id:"deep-talk",name:"Deep Talk Circle",type:"ACTIVITY",featureKey:"paid_activity_access",plans:["Plus","Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:2},
    {id:"couple-trivia",name:"Couple Trivia Battle",type:"GAME",featureKey:"paid_activity_access",plans:["Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:3},
    {id:"compatibility-clash",name:"Compatibility Clash",type:"GAME",featureKey:"compatibility",plans:["Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:3},
    {id:"beat-clock",name:"Beat the Clock",type:"GAME",featureKey:"paid_activity_access",plans:["Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:3},
    {id:"word-chain",name:"Word Chain Battle",type:"GAME",featureKey:"paid_activity_access",plans:["Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:3},
    {id:"picture-puzzle",name:"Picture Puzzle Duel",type:"GAME",featureKey:"paid_activity_access",plans:["Pro","Premium"],spectatorPlans:["Basic","Plus","Pro","Premium"],audience:["ALL"],enabled:true,priority:3}
  ],
  bundles:[
    {id:"premium-starter",name:"Premium Starter Bundle",description:"A starter pack of premium actions.",audience:["ALL"],billing:"ONE_TIME",price:199,validityDays:30,enabled:true,items:[{featureKey:"super_spark",quantity:10},{featureKey:"boost",quantity:3},{featureKey:"pre_match_message",quantity:5}]}
  ],
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
  ].map((row:any[])=>({key:String(row[0]),name:String(row[1]),description:String(row[2]),plans:(row[3] as string[]).map((x)=>x as PlanName),audience:["ALL"] as Audience[]})) 
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
function normalizeConfig(raw:any):PlanConfig{
  const c=raw||DEFAULT_PLAN_CONFIG;
  return {launchMode:c.launchMode==="MONETIZED"?"MONETIZED":"FREE_ALL",plans:c.plans||DEFAULT_PLAN_CONFIG.plans,features:Array.isArray(c.features)?c.features.map((f:any)=>({...f,audience:Array.isArray(f.audience)&&f.audience.length?f.audience:["ALL"]})):DEFAULT_PLAN_CONFIG.features,standaloneProducts:Array.isArray(c.standaloneProducts)?c.standaloneProducts:DEFAULT_PLAN_CONFIG.standaloneProducts,bundles:Array.isArray(c.bundles)?c.bundles:DEFAULT_PLAN_CONFIG.bundles,adSettings:{enabled:c.adSettings?.enabled!==false,freePlans:Array.isArray(c.adSettings?.freePlans)?c.adSettings.freePlans:["Basic"],frequency:Math.max(1,Number(c.adSettings?.frequency)||10),placement:"DISCOVERY_AFTER_N_PROFILES"},experiences:Array.isArray(c.experiences)?c.experiences.map((e:any)=>({...e,plans:Array.isArray(e.plans)?e.plans.filter((p:any)=>PLAN_NAMES.includes(p)):[],spectatorPlans:Array.isArray(e.spectatorPlans)?e.spectatorPlans.filter((p:any)=>PLAN_NAMES.includes(p)):[],audience:Array.isArray(e.audience)&&e.audience.length?e.audience:["ALL"],enabled:e.enabled!==false})):DEFAULT_PLAN_CONFIG.experiences};
}
export async function getPlanConfig():Promise<PlanConfig>{
  await ensurePlanConfigSchema();
  const db=getDb();
  const q=await db.execute(sql`SELECT config FROM plan_config WHERE id=1`);
  return normalizeConfig((q as any).rows?.[0]?.config);
}
export function normalizePlan(value:unknown):PlanName{
  const p=String(value||"Basic").toLowerCase();
  return p==="premium"?"Premium":p==="pro"?"Pro":p==="plus"?"Plus":"Basic";
}
export async function hasPlanFeature(plan:unknown,key:string,audience:unknown="ALL"){
  const config=await getPlanConfig();
  if(config.launchMode==="FREE_ALL")return true;
  const p=normalizePlan(plan); const a=String(audience||"ALL").toUpperCase() as Audience;
  return config.features.some(f=>f.key===key&&f.plans.includes(p)&&(f.audience?.includes("ALL")||f.audience?.includes(a)));
}

export function getExperienceAccess(config:PlanConfig, experienceId:string, plan:PlanName):ExperienceAccess|null { const e=config.experiences.find(x=>x.id===experienceId && x.enabled); if(!e)return null; if(config.launchMode==="FREE_ALL" || e.plans.includes(plan))return "PLAY"; if(e.spectatorPlans.includes(plan))return "SPECTATE"; return null; }
