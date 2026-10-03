import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { createMediaUploadToken, getCurrentUser, verifyMediaUploadToken } from "../../../../../lib/auth";

const allowed=["image/*","audio/*","video/*"];

export async function GET(){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  return NextResponse.json({clientPayload:createMediaUploadToken(current.user.id)});
}

export async function POST(request:Request){
  try{
    const body=await request.json();
    let userId=(await getCurrentUser())?.user.id||null;
    if(!userId){
      const clientPayload=body?.payload?.clientPayload;
      if(typeof clientPayload==="string") userId=verifyMediaUploadToken(clientPayload);
    }
    if(!userId)return NextResponse.json({error:"Sign in required."},{status:401});
    return NextResponse.json(await handleUpload({
      body,
      request,
      onBeforeGenerateToken:async(pathname)=>{
        const prefix="profile-media/"+userId+"/";
        if(!pathname.startsWith(prefix)) throw new Error("Invalid profile media path.");
        return {
          allowedContentTypes:allowed,
          maximumSizeInBytes:50*1024*1024,
          addRandomSuffix:true,
          tokenPayload:JSON.stringify({userId})
        };
      },
      onUploadCompleted:async()=>{}
    }));
  }catch(error){
    console.error("profile media upload token failed",error);
    return NextResponse.json({error:"Could not authorize profile media upload."},{status:400});
  }
}
