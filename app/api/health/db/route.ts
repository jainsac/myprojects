import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return NextResponse.json({ ok: false, database: "not_configured" }, { status: 503 });
    const client = neon(databaseUrl);

    await client`create extension if not exists pgcrypto`;
    await client`do $$ begin
      create type account_status as enum ('active','paused','deleted');
    exception when duplicate_object then null; end $$`;
    await client`do $$ begin
      create type identity_verification_status as enum ('pending','verified','rejected','restricted');
    exception when duplicate_object then null; end $$`;

    await client`create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      auth_user_id text not null,
      email text,
      phone text,
      password_hash text,
      status account_status not null default 'active',
      is_admin boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;
    await client`create unique index if not exists users_auth_user_id_idx on users(auth_user_id)`;
    await client`create unique index if not exists users_email_idx on users(email)`;

    await client`create table if not exists profiles (
      user_id uuid primary key references users(id) on delete cascade,
      display_name text not null,
      date_of_birth timestamp,
      city text,
      bio text,
      avatar_url text,
      voice_intro_url text,
      relationship_goals jsonb not null default '[]'::jsonb,
      communication_style text,
      lifestyle_preferences jsonb not null default '{}'::jsonb,
      family_expectations jsonb not null default '{}'::jsonb,
      privacy_settings jsonb not null default '{}'::jsonb,
      verification jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;

    await client`create table if not exists identity_verifications (
      user_id uuid primary key references users(id) on delete cascade,
      legal_name text not null,
      government_id_type text not null,
      government_id_last4 text,
      selfie_front_url text,
      selfie_left_url text,
      selfie_right_url text,
      status identity_verification_status not null default 'pending',
      provider text,
      provider_reference text,
      verified_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;

    const result = await client`select to_regclass('public.users') as users_table`;
    return NextResponse.json({ ok: true, usersTable: result[0]?.users_table ?? null, schemaBootstrapped: true });
  } catch (error) {
    console.error("Database bootstrap failed", error);
    return NextResponse.json({ ok: false, database: "error" }, { status: 503 });
  }
}
