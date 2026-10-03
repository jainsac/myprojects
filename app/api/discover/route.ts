import { NextResponse } from "next/server";
import { and, eq, ne, notInArray, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { blocks, profileMedia, profiles, sparks, users } from "../../../lib/db/schema";

export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = getDb();
  const url = new URL(request.url);
  const company = url.searchParams.get("company")?.trim();
  const profession = url.searchParams.get("profession")?.trim();
  const religion = url.searchParams.get("religion")?.trim();
  const community = url.searchParams.get("community")?.trim();

  const blockedRows = await db.select({ id: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, current.user.id));
  const blockedIds = blockedRows.map(x => x.id);
  const conditions = [ne(users.id, current.user.id), eq(users.status, "active")];
  if (blockedIds.length) conditions.push(notInArray(users.id, blockedIds));
  if (company) conditions.push(sql\`lower(coalesce(\${profiles.lifestylePreferences}->>'company','')) like \${`%${company.toLowerCase()}%`}`);
  if (profession) conditions.push(sql\`lower(coalesce(\${profiles.lifestylePreferences}->>'profession','')) like \${`%${profession.toLowerCase()}%`}`);
  if (religion) conditions.push(sql\`lower(coalesce(\${profiles.lifestylePreferences}->>'religion','')) like \${`%${religion.toLowerCase()}%`}`);
  if (community) conditions.push(sql\`lower(coalesce(\${profiles.lifestylePreferences}->>'community','')) like \${`%${community.toLowerCase()}%`}`);

  const rows = await db.select({
    id: users.id, displayName: profiles.displayName, city: profiles.city, bio: profiles.bio,
    avatarUrl: profiles.avatarUrl, relationshipGoals: profiles.relationshipGoals, lifestylePreferences: profiles.lifestylePreferences,
  }).from(users).innerJoin(profiles, eq(profiles.userId, users.id)).where(and(...conditions)).limit(30);

  const sent = await db.select({ toUserId: sparks.toUserId }).from(sparks).where(eq(sparks.fromUserId, current.user.id));
  const sentIds = new Set(sent.map(x => x.toUserId));
  const filtered = rows.filter(x => !sentIds.has(x.id));
  const ids = filtered.map(x => x.id);
  const mediaRows = ids.length ? await db.select({
    userId: profileMedia.userId, storageKey: profileMedia.storageKey, thumbnailKey: profileMedia.thumbnailKey, position: profileMedia.position
  }).from(profileMedia).where(and(inArray(profileMedia.userId, ids), eq(profileMedia.type, "photo"), eq(profileMedia.moderationStatus, "approved"))) : [];
  const mediaByUser = new Map<string, string[]>();
  for (const m of mediaRows.sort((a,b)=>(a.position??0)-(b.position??0))) {
    const mediaUrl = m.storageKey?.startsWith("http") ? m.storageKey : (m.thumbnailKey?.startsWith("http") ? m.thumbnailKey : "");
    if (mediaUrl) mediaByUser.set(m.userId, [...(mediaByUser.get(m.userId) || []), mediaUrl]);
  }
  return NextResponse.json({
    profiles: filtered.map(x => ({
      ...x,
      media: Array.from(new Set([x.avatarUrl, ...(mediaByUser.get(x.id) || [])].filter(Boolean))),
      company: (x.lifestylePreferences as any)?.company || "",
      profession: (x.lifestylePreferences as any)?.profession || "",
      religion: (x.lifestylePreferences as any)?.religion || "",
      community: (x.lifestylePreferences as any)?.community || "",
    }))
  });
}
