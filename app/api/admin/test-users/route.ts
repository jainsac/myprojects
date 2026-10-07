import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, or } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { users, profiles, identityVerifications } from "../../../../lib/db/schema";
import { getCurrentUser, isAdmin, setSession, createTestSessionToken } from "../../../../lib/auth";

const TEST_USERS=[
  {key:"sachin",name:"Sachin Test",email:"cuddl.test.sachin@cuddl.local",phone:"+919900000101"},
  {key:"aanya",name:"Aanya Test",email:"cuddl.test.aanya@cuddl.local",phone:"+919900000102"},
  {key:"riya",name:"Riya Test",email:"cuddl.test.riya@cuddl.local",phone:"+919900000103"},
  {key:"rohan",name:"Rohan Test",email:"cuddl.test.rohan@cuddl.local",phone:"+919900000104"},
  {key:"neha",name:"Neha Spectator",email:"cuddl.test.neha@cuddl.local",phone:"+919900000105"}
];

async function guard(){
  const current=await getCurrentUser();
  return current && isAdmin(current) ? current : null;
}

export async function GET(){
  const current=await guard();
  if(!current)return NextResponse.json({error:"Admin access required."},{status:403});
  const db=getDb();
  const rows=await db.select({id:users.id,email:users.email,profile:profiles})
    .from(users).leftJoin(profiles,eq(profiles.userId,users.id))
    .where(or(...TEST_USERS.map(x=>eq(users.email,x.email))));
  return NextResponse.json({users:rows.map((r:any)=>({...TEST_USERS.find(x=>x.email===r.email),userId:r.id,profile:r.profile}))});
}

export async function POST(request:Request){
  const current=await guard();
  if(!current)return NextResponse.json({error:"Admin access required."},{status:403});
  const body=await request.json().catch(()=>({}));
  const action=String(body?.action||"seed");
  const db=getDb();

  if(action==="seed"){
    const created=[];
    for(const t of TEST_USERS){
      const existing=await db.select({id:users.id}).from(users).where(eq(users.email,t.email)).limit(1);
      if(existing[0])continue;
      const row=await db.insert(users).values({authUserId:"test:"+t.email,email:t.email,phone:t.phone}).returning({id:users.id});
      const id=row[0].id;
      await db.insert(profiles).values({
        userId:id,displayName:t.name,city:"Delhi",bio:"Cuddl internal multiplayer test profile.",
        relationshipGoals:["long-term"],
        lifestylePreferences:{
          gender:"ANY",desiredGender:"ANY",state:"Delhi",maritalStatus:"Single",
          relationshipGoal:"Long-term",profession:"Test Player",education:"Masters",
          foodPreference:"Foodie",diet:"Vegetarian",children:"Open to it",pets:"Love pets",
          smoking:"Never",drinking:"Socially",religion:"Hindu",community:"Test",profileShowcase:[]
        },
        verification:{aiAutoVerified:true,aiVerificationStatus:"passed",adminVerificationStatus:"verified",photoVerified:true,phoneVerified:true,emailVerified:true}
      });
      await db.insert(identityVerifications).values({
        userId:id,legalName:t.name,governmentIdType:"OTHER",governmentIdLast4:"0000",
        status:"verified",provider:"cuddl-test",providerReference:"internal-test-user"
      });
      created.push(t.email);
    }
    return NextResponse.json({ok:true,created,users:TEST_USERS});
  }

  if(action==="switch"){
    const email=String(body?.email||"").toLowerCase();
    const target=TEST_USERS.find(x=>x.email===email);
    if(!target)return NextResponse.json({error:"Unknown test user."},{status:400});
    const rows=await db.select({id:users.id}).from(users).where(eq(users.email,target.email)).limit(1);
    if(!rows[0])return NextResponse.json({error:"Seed test users first."},{status:404});
    await setSession(rows[0].id);
    (await cookies()).set("cuddl_admin_return",current.user.id,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60});
    return NextResponse.json({ok:true,user:{name:target.name,email:target.email}});
  }

  if(action==="launch"){
    const email=String(body?.email||"").toLowerCase();
    const target=TEST_USERS.find(x=>x.email===email);
    if(!target)return NextResponse.json({error:"Unknown test user."},{status:400});
    const rows=await db.select({id:users.id}).from(users).where(eq(users.email,target.email)).limit(1);
    if(!rows[0])return NextResponse.json({error:"Seed test users first."},{status:404});
    const token=createTestSessionToken(rows[0].id);
    return NextResponse.json({ok:true,user:{name:target.name,email:target.email},launchUrl:"/api/test-session?token="+encodeURIComponent(token)});
  }

  if(action==="return"){
    const returnId=(await cookies()).get("cuddl_admin_return")?.value;
    if(!returnId)return NextResponse.json({error:"No admin session to return to."},{status:400});
    const db2=getDb();
    const adminRows=await db2.select({id:users.id}).from(users).where(eq(users.id,returnId)).limit(1);
    if(!adminRows[0])return NextResponse.json({error:"Admin session not found."},{status:404});
    await setSession(adminRows[0].id);
    (await cookies()).set("cuddl_admin_return","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});
    return NextResponse.json({ok:true});
  }

  return NextResponse.json({error:"Unsupported action."},{status:400});
}