import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";
import { profileMedia } from "../../../../../lib/db/schema";

export async function GET(){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const rows=await getDb().select({
      id:profileMedia.id,
      type:profileMedia.type,
      storageKey:profileMedia.storageKey,
      position:profileMedia.position
    }).from(profileMedia).where(eq(profileMedia.userId,current.user.id)).orderBy(asc(profileMedia.position));
    return NextResponse.json({media:rows});
  }catch(error){
    console.error("profile media list failed",error);
    return NextResponse.json({media:[]});
  }
}
