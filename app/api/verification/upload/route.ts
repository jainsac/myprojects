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
        const verificationPrefix=`verification/${current.user.id}/`;
        const profilePrefix=`profile-media/${current.user.id}/`;
        const isVerification=pathname.startsWith(verificationPrefix) && pathname.endsWith(".jpg");
        const isProfile=pathname.startsWith(profilePrefix);
        if(!isVerification && !isProfile) throw new Error("Invalid upload path.");
        return {
          allowedContentTypes:isVerification?["image/jpeg"]:["image/jpeg","image/png","image/webp","audio/webm","audio/mp4","audio/mpeg","video/webm","video/mp4"],
          maximumSizeInBytes:isVerification?3*1024*1024:25*1024*1024,
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
