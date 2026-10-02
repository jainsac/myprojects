import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getCurrentUser } from "../../../../lib/auth";

export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current) return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const body=await request.json();
    return NextResponse.json(await handleUpload({
      body,
      request,
      onBeforeGenerateToken:async(pathname)=>{
        const prefix=`verification/${current.user.id}/`;
        if(!pathname.startsWith(prefix) || !pathname.endsWith(".jpg")) throw new Error("Invalid verification upload path.");
        return {
          allowedContentTypes:["image/jpeg"],
          maximumSizeInBytes:3*1024*1024,
          addRandomSuffix:true,
          tokenPayload:JSON.stringify({userId:current.user.id})
        };
      },
      onUploadCompleted:async()=>{}
    }));
  }catch(error){
    console.error("verification upload token failed",error);
    return NextResponse.json({error:"Could not authorize private upload."},{status:400});
  }
}
