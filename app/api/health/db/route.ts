import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return NextResponse.json({ ok: false, database: "not_configured" }, { status: 503 });
    const client = neon(databaseUrl);

    await client`create extension if not exists pgcrypto`;
    await client`create table if not exists identity_signals (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete cascade,
      signal_type text not null,
      fingerprint text not null,
      confidence real,
      action text not null,
      created_at timestamptz not null default now()
    )`;

    const result = await client`select to_regclass('public.users') as users_table, to_regclass('public.identity_signals') as identity_signals_table`;
    return NextResponse.json({ ok: true, usersTable: result[0]?.users_table ?? null, identitySignalsTable: result[0]?.identity_signals_table ?? null });
  } catch (error) {
    console.error("Database bootstrap failed", error);
    return NextResponse.json({ ok: false, database: "error" }, { status: 503 });
  }
}
