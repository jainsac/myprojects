import { sql } from "drizzle-orm";
import { getDb } from "./db";

let ready:Promise<void>|null=null;

export function ensureRewardsSchema(){
  if(ready)return ready;
  ready=(async()=>{
    const db=getDb();
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS referral_settings (
        id integer PRIMARY KEY DEFAULT 1,
        enabled boolean NOT NULL DEFAULT true,
        reward_type text NOT NULL DEFAULT 'PLAN_EXTENSION',
        reward_value jsonb NOT NULL DEFAULT '{}'::jsonb,
        qualification_event text NOT NULL DEFAULT 'PROFILE_COMPLETE',
        max_rewards_per_user integer NOT NULL DEFAULT 20,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS referral_codes (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        code text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS referrals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        referral_code text NOT NULL,
        status text NOT NULL DEFAULT 'PENDING',
        qualification_event text,
        qualified_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);
      CREATE TABLE IF NOT EXISTS reward_ledger (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        source_type text NOT NULL,
        source_id text,
        reward_type text NOT NULL,
        reward_value jsonb NOT NULL DEFAULT '{}'::jsonb,
        status text NOT NULL DEFAULT 'CREDITED',
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS offer_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text NOT NULL UNIQUE,
        enabled boolean NOT NULL DEFAULT true,
        discount_type text NOT NULL DEFAULT 'PERCENT',
        discount_value numeric NOT NULL DEFAULT 0,
        reward_type text NOT NULL DEFAULT 'DISCOUNT',
        reward_value jsonb NOT NULL DEFAULT '{}'::jsonb,
        applicable_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
        max_redemptions integer,
        per_user_limit integer NOT NULL DEFAULT 1,
        redeemed_count integer NOT NULL DEFAULT 0,
        min_purchase numeric NOT NULL DEFAULT 0,
        starts_at timestamptz,
        ends_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS offer_redemptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id uuid NOT NULL REFERENCES offer_codes(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        purchase_reference text,
        discount_amount numeric NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS offer_redemptions_user_idx ON offer_redemptions(user_id);
    `);
    await db.execute(sql`INSERT INTO referral_settings(id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
    await db.execute(sql\`
      CREATE TABLE IF NOT EXISTS bottle_settings (
        id integer PRIMARY KEY DEFAULT 1,
        pro_monthly_limit integer NOT NULL DEFAULT 2,
        premium_monthly_limit integer NOT NULL DEFAULT 5,
        open_timeout_days integer NOT NULL DEFAULT 30,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS bottles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id uuid REFERENCES users(id) ON DELETE SET NULL,
        content_text text,
        media jsonb NOT NULL DEFAULT '[]'::jsonb,
        status text NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(),
        opened_at timestamptz,
        expires_at timestamptz,
        opened_action text,
        connection_requested boolean NOT NULL DEFAULT false
      );
      CREATE INDEX IF NOT EXISTS bottles_sender_status_idx ON bottles(sender_id,status);
      CREATE INDEX IF NOT EXISTS bottles_receiver_status_idx ON bottles(receiver_id,status);
    \`);
    await db.execute(sql\`INSERT INTO bottle_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING\`);
  })();
  return ready;
}
