import { NextResponse } from "next/server";
import { and, eq, ne, notInArray } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { blocks, profiles, sparks, users } from "../../../lib/db/schema";

const testProfiles = [
  { id:"11111111-1111-4111-8111-111111111111", displayName:"Aanya", age:27, city:"Delhi", bio:"Music, travel and trying new food spots.", tags:["Music","Travel","Dogs"], score:94, gender:"FEMALE", photos:[47,49,44,48], company:"TechNova", profession:"Product Designer", religion:"Hindu", community:"Khatri" },
  { id:"22222222-2222-4222-8222-222222222222", displayName:"Riya", age:29, city:"Gurugram", bio:"Books, yoga, music and quiet cafés.", tags:["Books","Yoga","Music"], score:91, gender:"FEMALE", photos:[45,46,43,42], company:"Deloitte", profession:"Consultant", religion:"Hindu", community:"Brahmin" },
  { id:"33333333-3333-4333-8333-333333333333", displayName:"Meera", age:26, city:"Noida", bio:"Art, food and weekend mountain plans.", tags:["Art","Food","Mountains"], score:88, gender:"FEMALE", photos:[32,29,31,25], company:"Adobe", profession:"UX Researcher", religion:"Jain", community:"Oswal" },
  { id:"44444444-4444-4444-8444-444444444444", displayName:"Kabir", age:28, city:"Delhi", bio:"Chess, karaoke and spontaneous road trips.", tags:["Chess","Karaoke","Travel"], score:90, gender:"MALE", photos:[12,13,11,14], company:"Infosys", profession:"Software Engineer", religion:"Hindu", community:"Rajput" },
  { id:"55555555-5555-4555-8555-555555555555", displayName:"Arjun", age:30, city:"Gurugram", bio:"Fitness, football and exploring new restaurants.", tags:["Fitness","Football","Food"], score:89, gender:"MALE", photos:[15,16,17,18], company:"Google", profession:"Data Analyst", religion:"Hindu", community:"Bania" },
  { id:"66666666-6666-4666-8666-666666666666", displayName:"Vivaan", age:27, city:"Noida", bio:"Photography, indie music and city walks.", tags:["Photography","Music","Walks"], score:87, gender:"MALE", photos:[19,20,21,22], company:"Microsoft", profession:"Product Manager", religion:"Sikh", community:"Jat" },
  { id:"77777777-7777-4777-8777-777777777777", displayName:"Naina", age:28, city:"Delhi", bio:"Dance, cafés and weekend getaways.", tags:["Dance","Travel","Cafés"], score:92, gender:"FEMALE", photos:[23,24,26,27], company:"Amazon", profession:"Marketing Manager", religion:"Hindu", community:"Kayastha" },
  { id:"88888888-8888-4888-8888-888888888888", displayName:"Ishita", age:25, city:"Noida", bio:"Sketching, books and discovering hidden cafés.", tags:["Art","Books","Coffee"], score:86, gender:"FEMALE", photos:[28,30,33,34], company:"TCS", profession:"Architect", religion:"Hindu", community:"Brahmin" },
];

function testPhotoUrls(ids:number[]){ return ids.map(id=>`https://i.pravatar.cc/900?img=${id}`); }

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

  const realProfiles = rows.filter(x => !sentIds.has(x.id)).map((profile) => {
    const existing = profile.lifestylePreferences && typeof profile.lifestylePreferences === "object"
      ? profile.lifestylePreferences as Record<string, unknown> : {};
    return { ...profile, lifestylePreferences: existing };
  });

  const test = testProfiles.map(p => ({
    id:p.id, displayName:p.displayName, age:p.age, city:p.city, bio:p.bio,
    avatarUrl:testPhotoUrls(p.photos)[0],
    tags:p.tags, score:p.score, isTestProfile:true,
    lifestylePreferences:{
      gender:p.gender, photos:testPhotoUrls(p.photos), company:p.company,
      profession:p.profession, religion:p.religion, community:p.community,
    },
  }));

  const currentPrefs = (current.profile?.lifestylePreferences || {}) as Record<string, unknown>;
  const ownGender = String(currentPrefs.gender || "").trim().toUpperCase();
  const desiredGender = String(currentPrefs.desiredGender || "").trim().toUpperCase();
  const effectiveDesired = desiredGender || (ownGender === "MALE" ? "FEMALE" : ownGender === "FEMALE" ? "MALE" : "");

  const visible = [...realProfiles, ...test].filter((profile:any) => {
    if (!effectiveDesired || effectiveDesired === "ANY") return true;
    const gender = String(profile.lifestylePreferences?.gender || "").toUpperCase();
    return gender === effectiveDesired;
  });

  return NextResponse.json({
    profiles: visible,
    discovery:{desiredGender:effectiveDesired || "ANY", requiresPreference:!effectiveDesired}
  });
}
