import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { getUserPlan } from "../../../lib/user-plan";
export async function GET(){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({authenticated:false});
  const plan=await getUserPlan(current.user.id);
  return NextResponse.json({authenticated:true,user:{...current.user,plan},profile:current.profile});
}
