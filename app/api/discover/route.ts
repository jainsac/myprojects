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

function testPhotoUrls(name:string,ids:number[]){
  return ids.map((id,index)=>{
    const palettes=[
      ["#ffd8df","#f28b9a","#5b3540","#2a1e22"],
      ["#ffe0c7","#e79b72","#3f2c2a","#21191a"],
      ["#d9e9ff","#8bb5ea","#3b3b52","#1d1d2b"],
      ["#eadcff","#b49be7","#4a365f","#211a29"],
    ];
    const [bg,skin,hair,shirt]=palettes[(id+index)%palettes.length];
    const initial=name.slice(0,1).toUpperCase();
    const tilt=[-3,2,-1,3][index%4];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100">
      <defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
      <rect width="900" height="1100" fill="url(#g${id})"/>
      <circle cx="450" cy="370" r="185" fill="${skin}"/>
      <path d="M265 350c18-175 125-235 235-220 122 16 169 104 135 247-44-74-96-109-175-109-78 0-141 34-195 82z" fill="${hair}"/>
      <ellipse cx="385" cy="390" rx="13" ry="18" fill="#171316"/><ellipse cx="515" cy="390" rx="13" ry="18" fill="#171316"/>
      <path d="M410 470q40 24 80 0" fill="none" stroke="#6d4047" stroke-width="10" stroke-linecap="round"/>
      <path d="M205 1100c16-235 117-350 245-350s229 115 245 350" fill="${shirt}"/>
      <circle cx="450" cy="960" r="72" fill="rgba(255,255,255,.12)"/>
      <text x="450" y="986" text-anchor="middle" font-family="Arial, sans-serif" font-size="78" font-weight="800" fill="rgba(255,255,255,.88)">${initial}</text>
      <text x="450" y="1060" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="rgba(255,255,255,.82)">Cuddl test portrait ${index+1}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  });
}

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = getDb();
  const blockedRows = await db.select({ id: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, current.user.id));
  const blockedIds = blockedRows.map(x => x.id);
  const conditions = [ne(users.id, current.user.id), eq(users.status, "active")];
  if (blockedIds.length) conditions.push(notInArray(users.id, blockedIds));

  const rows = await db.select({
    id: users.id, displayName: profiles.displayName, city: profiles.city, bio: profiles.bio, dateOfBirth: profiles.dateOfBirth,
    avatarUrl: profiles.avatarUrl, relationshipGoals: profiles.relationshipGoals, lifestylePreferences: profiles.lifestylePreferences,
  }).from(users).innerJoin(profiles, eq(profiles.userId, users.id)).where(and(...conditions)).limit(30);

  const sent = await db.select({ toUserId: sparks.toUserId }).from(sparks).where(eq(sparks.fromUserId, current.user.id));
  const sentIds = new Set(sent.map(x => x.toUserId));

  const calculateAge=(dob:any)=>{if(!dob)return undefined;const d=new Date(dob);if(Number.isNaN(d.getTime()))return undefined;const now=new Date();let age=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))age--;return age>0?age:undefined;};
  const realProfiles = rows.filter(x => !sentIds.has(x.id)).map((profile) => {
    const existing = profile.lifestylePreferences && typeof profile.lifestylePreferences === "object"
      ? profile.lifestylePreferences as Record<string, unknown> : {};
    return { ...profile, age:calculateAge(profile.dateOfBirth), lifestylePreferences: existing };
  });

  const test = testProfiles.map(p => ({
    id:p.id, displayName:p.displayName, age:p.age, city:p.city, bio:p.bio,
    avatarUrl:testPhotoUrls(p.displayName,p.photos)[0],
    tags:p.tags, score:p.score, isTestProfile:true,
    lifestylePreferences:{
      gender:p.gender, photos:testPhotoUrls(p.displayName,p.photos), company:p.company,
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
