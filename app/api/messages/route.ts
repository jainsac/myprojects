import { NextResponse } from "next/server";
import { and, asc, eq, or } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { matches, messages } from "../../../lib/db/schema";

export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const matchId = new URL(request.url).searchParams.get("matchId") || "";
  const db = getDb();
  const match = await db.select().from(matches).where(and(eq(matches.id, matchId), or(eq(matches.userAId, current.user.id), eq(matches.userBId, current.user.id)))).limit(1);
  if (!match.length) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  const rows = await db.select().from(messages).where(eq(messages.matchId, matchId)).orderBy(asc(messages.createdAt));
  return NextResponse.json({ messages: rows });
}

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const body = await request.json();
    const matchId = String(body.matchId || "");
    const text = String(body.body || "").trim().slice(0, 2000);
    if (!matchId || !text) return NextResponse.json({ error: "Match and message are required." }, { status: 400 });
    const db = getDb();
    const match = await db.select().from(matches).where(and(eq(matches.id, matchId), or(eq(matches.userAId, current.user.id), eq(matches.userBId, current.user.id)))).limit(1);
    if (!match.length) return NextResponse.json({ error: "Match not found." }, { status: 404 });
    const [message] = await db.insert(messages).values({ matchId, senderId: current.user.id, body: text }).returning();
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not send message." }, { status: 500 });
  }
}
