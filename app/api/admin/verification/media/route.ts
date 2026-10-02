import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { requireAdmin } from "../../../../../lib/auth";

export async function GET(request:Request){
  const current=await requireAdmin();
  if(!current) return NextResponse.json({error:"Admin access required."},{status:403});
  const pathname=new URL(request.url).searchParams.get("pathname")||"";
  if(!pathname.startsWith("verification/")) return NextResponse.json({error:"Invalid media path."},{status:400});
  try{
    const result=await get(pathname,{access:"private",useCache:false});
    if(!result) return NextResponse.json({error:"Media not found."},{status:404});
    return new Response(result.stream,{headers:{"Content-Type":result.blob.contentType||"image/jpeg","Cache-Control":"private, no-store"}});
  }catch(error){
    console.error("verification media read failed",error);
    return NextResponse.json({error:"Could not read verification media."},{status:404});
  }
}
