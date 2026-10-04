import { get } from "@vercel/blob";
import { CompareFacesCommand, DetectFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";

type MatchResult = { similarity:number; sourceConfidence:number; targetFaceCount:number };

function client(){
  const region=process.env.AWS_REGION;
  if(!region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  return new RekognitionClient({region});
}

async function bytes(pathname:string){
  const result=await get(pathname,{access:"private"});
  if(!result?.stream) throw new Error("Verification image could not be read.");
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

async function faceCount(image:Buffer){
  const c=client(); if(!c) throw new Error("AI verification provider is not configured.");
  const result=await c.send(new DetectFacesCommand({Image:{Bytes:image},Attributes:["DEFAULT"]}));
  return result.FaceDetails?.length||0;
}

async function compare(source:Buffer,target:Buffer):Promise<MatchResult>{
  const c=client(); if(!c) throw new Error("AI verification provider is not configured.");
  const targetFaceCount=await faceCount(target);
  if(targetFaceCount!==1) return {similarity:0,sourceConfidence:0,targetFaceCount};
  const result=await c.send(new CompareFacesCommand({
    SourceImage:{Bytes:source},
    TargetImage:{Bytes:target},
    SimilarityThreshold:80,
    QualityFilter:"AUTO",
  }));
  const best=result.FaceMatches?.sort((a,b)=>(b.Similarity||0)-(a.Similarity||0))[0];
  return {
    similarity:Number(best?.Similarity||0),
    sourceConfidence:Number(result.SourceImageFace?.Confidence||0),
    targetFaceCount,
  };
}

export async function runAiIdentityCheck(profilePhotoPath:string,capturePaths:string[]){
  if(!client()) return {configured:false,passed:false,reason:"AI provider is not configured.",scores:[] as number[]};
  const source=await bytes(profilePhotoPath);
  const sourceFaces=await faceCount(source);
  if(sourceFaces!==1) return {configured:true,passed:false,reason:"Profile photo must contain exactly one clear face.",scores:[] as number[]};
  const results:MatchResult[]=[];
  for(const path of capturePaths) results.push(await compare(source,await bytes(path)));
  const scores=results.map(x=>x.similarity);
  const threshold=Number(process.env.VERIFICATION_AI_THRESHOLD||90);
  const passed=results.length===3 && results.every(x=>x.targetFaceCount===1 && x.similarity>=threshold && x.sourceConfidence>=90);
  return {configured:true,passed,threshold,scores,reason:passed?"AI face match passed.":"AI face match failed."};
}
