import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getCurrentUser } from "../../../../../lib/auth";

const allowed=["image/*","audio/*","video/*"];

export async function POST(request:Request){
  const current=await getCurrentUser();
  if(!current)return NextResponse.json({error:"Sign in required."},{status:401});
  try{
    const body=await request.json();
    return NextResponse.json(await handleUpload({
      body,
      request,
      onBeforeGenerateToken:async(pathname)=>{
        const prefix=`profile-media/${current.user.id}/`;
        if(!pathname.startsWith(prefix)) throw new Error("Invalid profile media path.");
        return {
          allowedContentTypes:allowed,
          maximumSizeInBytes:50*1024*1024,
          addRandomSuffix:true,
          tokenPayload:JSON.stringify({userId:current.user.id})
        };
      },
      onUploadCompleted:async()=>{}
    }));
  }catch(error){
    console.error("profile media upload token failed",error);
    return NextResponse.json({error:"Could not authorize profile media upload."},{status:400});
  }
}
