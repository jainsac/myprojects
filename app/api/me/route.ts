import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
export async function GET(){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({authenticated:false});
  return NextResponse.json({authenticated:true,user:current.user,profile:current.profile});
}
