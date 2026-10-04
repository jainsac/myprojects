import { sql } from "drizzle-orm";
import { getDb } from "./db";
let ready:Promise<void>|null=null;
export async function ensureMonetizationSchema(){
  if(ready)return ready;
  ready=(async()=>{
    const db=getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS feature_entitlements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, product_id text NOT NULL, source text NOT NULL, feature_key text NOT NULL, quantity integer NOT NULL DEFAULT 1, remaining_quantity integer NOT NULL DEFAULT 1, starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, status text NOT NULL DEFAULT 'ACTIVE', metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now())`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS feature_entitlements_user_feature_idx ON feature_entitlements(user_id,feature_key,status)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS monetization_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, event_name text NOT NULL, feature_key text, product_id text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now())`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS monetization_events_feature_idx ON monetization_events(feature_key,event_name,created_at)`);
  })();
  ready=ready.catch(e=>{ready=null;throw e});
  return ready;
}
export async function recordMonetizationEvent(userId:string|undefined,eventName:string,featureKey?:string,productId?:string,metadata:Record<string,unknown>={}){
  await ensureMonetizationSchema(); const db=getDb();
  await db.execute(sql`INSERT INTO monetization_events(user_id,event_name,feature_key,product_id,metadata) VALUES(${userId||null},${eventName},${featureKey||null},${productId||null},${JSON.stringify(metadata)}::jsonb)`);
}
export async function hasPurchasedFeature(userId:string,featureKey:string){
  await ensureMonetizationSchema(); const db=getDb();
  const q=await db.execute(sql`SELECT 1 FROM feature_entitlements WHERE user_id=${userId} AND feature_key=${featureKey} AND status='ACTIVE' AND remaining_quantity>0 AND (expires_at IS NULL OR expires_at>now()) LIMIT 1`);
  return !!(q as any).rows?.length;
}