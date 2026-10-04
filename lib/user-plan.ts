import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { PlanName, PLAN_NAMES } from "./plan-config";

export async function ensureUserPlanSchema(){
  const db=getDb();
  await db.execute(sql`CREATE TABLE IF NOT EXISTS user_plans (
    user_id text PRIMARY KEY,
    plan text NOT NULL DEFAULT 'Basic',
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
}
export async function getUserPlan(userId:string):Promise<PlanName>{
  await ensureUserPlanSchema();
  const db=getDb();
  const rows=await db.execute(sql`SELECT plan FROM user_plans WHERE user_id=${userId} LIMIT 1`);
  const p=String((rows as any).rows?.[0]?.plan||"Basic");
  return (PLAN_NAMES as readonly string[]).includes(p)?p as PlanName:"Basic";
}
export async function setUserPlan(userId:string,plan:PlanName){
  await ensureUserPlanSchema();
  const db=getDb();
  await db.execute(sql`INSERT INTO user_plans(user_id,plan) VALUES(${userId},${plan}) ON CONFLICT(user_id) DO UPDATE SET plan=EXCLUDED.plan,updated_at=now()`);
}
