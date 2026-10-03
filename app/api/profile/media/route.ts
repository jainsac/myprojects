import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  const pathname=new URL(request.url).searchParams.get("pathname")||"";
  if(!pathname.startsWith("profile-media/")) return NextResponse.json({error:"Invalid media path."},{status:400});
  try{
    const result=await get(pathname,{access:"private"});
    if(!result)return NextResponse.json({error:"Media not found."},{status:404});
    return new Response(result.stream,{headers:{"Content-Type":result.blob.contentType||"application/octet-stream","Cache-Control":"private, max-age=60"}});
  }catch(error){
    console.error("profile media read failed",error);
    return NextResponse.json({error:"Could not load media."},{status:404});
  }
}
