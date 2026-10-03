import { NextResponse } from "next/server";
import { and, eq, ne, notInArray } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { blocks, profiles, sparks, users } from "../../../lib/db/schema";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = getDb();
  const blockedRows = await db.select({ id: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, current.user.id));
  const blockedIds = blockedRows.map(x => x.id);
  const conditions = [ne(users.id, current.user.id), eq(users.status, "active")];
  if (blockedIds.length) conditions.push(notInArray(users.id, blockedIds));
  const rows = await db.select({
    id: users.id, displayName: profiles.displayName, city: profiles.city, bio: profiles.bio,
    avatarUrl: profiles.avatarUrl, relationshipGoals: profiles.relationshipGoals, lifestylePreferences: profiles.lifestylePreferences,
  }).from(users).innerJoin(profiles, eq(profiles.userId, users.id)).where(and(...conditions)).limit(30);
  const sent = await db.select({ toUserId: sparks.toUserId }).from(sparks).where(eq(sparks.fromUserId, current.user.id));
  const sentIds = new Set(sent.map(x => x.toUserId));
  return NextResponse.json({ profiles: rows.filter(x => !sentIds.has(x.id)) });
}
