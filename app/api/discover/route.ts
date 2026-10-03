import { NextResponse } from "next/server";
import { and, eq, ne, notInArray } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { blocks, profiles, sparks, users } from "../../../lib/db/schema";

const testProfilePhotos: Record<string, string[]> = {
  aanya: [
    "https://i.pravatar.cc/900?img=47",
    "https://i.pravatar.cc/900?img=49",
    "https://i.pravatar.cc/900?img=44",
    "https://i.pravatar.cc/900?img=48",
  ],
  riya: [
    "https://i.pravatar.cc/900?img=45",
    "https://i.pravatar.cc/900?img=46",
    "https://i.pravatar.cc/900?img=43",
    "https://i.pravatar.cc/900?img=42",
  ],
  meera: [
    "https://i.pravatar.cc/900?img=32",
    "https://i.pravatar.cc/900?img=29",
    "https://i.pravatar.cc/900?img=31",
    "https://i.pravatar.cc/900?img=25",
  ],
  kabir: [
    "https://i.pravatar.cc/900?img=12",
    "https://i.pravatar.cc/900?img=13",
    "https://i.pravatar.cc/900?img=11",
    "https://i.pravatar.cc/900?img=14",
  ],
};

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

  const visibleProfiles = rows
    .filter(x => !sentIds.has(x.id))
    .map((profile) => {
      const key = String(profile.displayName || "").trim().toLowerCase();
      const testPhotos = testProfilePhotos[key];
      if (!testPhotos) return profile;

      const existing = profile.lifestylePreferences && typeof profile.lifestylePreferences === "object"
        ? profile.lifestylePreferences as Record<string, unknown>
        : {};
      const existingPhotos = Array.isArray(existing.photos) ? existing.photos.filter(Boolean) : [];
      const photos = Array.from(new Set([...existingPhotos, ...testPhotos]));

      return {
        ...profile,
        lifestylePreferences: { ...existing, photos },
      };
    });

  return NextResponse.json({ profiles: visibleProfiles });
}
