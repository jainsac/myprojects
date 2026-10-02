import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { matches, sparks, users } from "../../../lib/db/schema";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = getDb();
  const rows = await db.select().from(sparks).where(or(eq(sparks.fromUserId, current.user.id), eq(sparks.toUserId, current.user.id)));
  return NextResponse.json({ sparks: rows });
}

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const body = await request.json();
    const toUserId = String(body.toUserId || "");
    const message = body.message ? String(body.message).slice(0, 500) : null;
    if (!toUserId || toUserId === current.user.id) return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
    const db = getDb();
    const target = await db.select({ id: users.id }).from(users).where(eq(users.id, toUserId)).limit(1);
    if (!target.length) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    const reciprocal = await db.select().from(sparks).where(and(eq(sparks.fromUserId, toUserId), eq(sparks.toUserId, current.user.id))).limit(1);
    if (reciprocal[0]?.status === "pending") {
      const [incoming] = await db.update(sparks).set({ status: "accepted", respondedAt: new Date() }).where(eq(sparks.id, reciprocal[0].id)).returning();
      const existing = await db.select().from(matches).where(or(
        and(eq(matches.userAId, current.user.id), eq(matches.userBId, toUserId)),
        and(eq(matches.userAId, toUserId), eq(matches.userBId, current.user.id))
      )).limit(1);
      const match = existing[0] ?? (await db.insert(matches).values({ userAId: current.user.id, userBId: toUserId, source: "spark" }).returning())[0];
      return NextResponse.json({ ok: true, matched: true, match, spark: incoming });
    }
    const existing = await db.select().from(sparks).where(and(eq(sparks.fromUserId, current.user.id), eq(sparks.toUserId, toUserId))).limit(1);
    if (existing.length) return NextResponse.json({ ok: true, spark: existing[0], matched: existing[0].status === "accepted" });
    const [spark] = await db.insert(sparks).values({ fromUserId: current.user.id, toUserId, message }).returning();
    return NextResponse.json({ ok: true, matched: false, spark });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not send Spark." }, { status: 500 });
  }
}
