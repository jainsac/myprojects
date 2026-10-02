import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { matches, profiles } from "../../../lib/db/schema";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = getDb();
  const rows = await db.select({
    id: matches.id, userAId: matches.userAId, userBId: matches.userBId, createdAt: matches.createdAt,
  }).from(matches).where(or(eq(matches.userAId, current.user.id), eq(matches.userBId, current.user.id)));
  const result = [];
  for (const m of rows) {
    const otherId = m.userAId === current.user.id ? m.userBId : m.userAId;
    const p = await db.select().from(profiles).where(eq(profiles.userId, otherId)).limit(1);
    if (p[0]) result.push({ ...m, other: p[0] });
  }
  return NextResponse.json({ matches: result });
}
