import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { users } from "../../../lib/db/schema";

export async function POST(){
  const current=await getCurrentUser();
  if(!current) return NextResponse.json({error:"Sign in required."},{status:401});
  await getDb().update(users).set({updatedAt:new Date()}).where(eq(users.id,current.user.id));
  return NextResponse.json({ok:true,activeNow:true});
}
