import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return NextResponse.json({ ok: false, database: "not_configured" }, { status: 503 });
    const client = neon(databaseUrl);
    const result = await client`select to_regclass('public.users') as users_table, to_regclass('public.identity_signals') as identity_signals_table`;
    return NextResponse.json({ ok: true, usersTable: result[0]?.users_table ?? null, identitySignalsTable: result[0]?.identity_signals_table ?? null });
  } catch (error) {
    console.error("Database health check failed", error);
    return NextResponse.json({ ok: false, database: "error" }, { status: 503 });
  }
}
