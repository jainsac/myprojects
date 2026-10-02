import { NextResponse } from "next/server";
import { sql } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ ok: false, database: "not_configured" }, { status: 503 });
    }

    const client = sql(databaseUrl);
    const result = await client`select now() as now`;

    return NextResponse.json({
      ok: true,
      database: "connected",
      serverTime: result[0]?.now ?? null,
    });
  } catch (error) {
    console.error("Database health check failed", error);
    return NextResponse.json({ ok: false, database: "error" }, { status: 503 });
  }
}
