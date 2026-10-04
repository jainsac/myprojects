import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    const db = getDb();
    await db.execute(sql`select 1 as ok`);
    return NextResponse.json({
      ok: true,
      status: "READY",
      service: "cuddl",
      database: "READY",
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("health_check_failed", error);
    return NextResponse.json({
      ok: false,
      status: "DEGRADED",
      service: "cuddl",
      database: "ERROR",
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
