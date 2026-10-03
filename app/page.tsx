"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decryptChatMessage, encryptChatMessage, registerChatPublicKey } from "../lib/chat-crypto";
import { upload } from "@vercel/blob/client";

type Tab = "discover" | "lounge" | "matches" | "dates" | "profile";
type Person = { name: string; age: number; city: string; initial: string; tags: string[]; score: number };

const people: Person[] = [
  { name: "Aanya", age: 27, city: "Delhi", initial: "A", tags: ["Music", "Travel", "Dogs"], score: 94 },
  { name: "Riya", age: 29, city: "Gurugram", initial: "R", tags: ["Books", "Yoga", "Music"], score: 91 },
  { name: "Meera", age: 26, city: "Noida", initial: "M", tags: ["Art", "Food", "Mountains"], score: 88 },
  { name: "Kabir", age: 28, city: "Delhi", initial: "K", tags: ["Chess", "Karaoke", "Travel"], score: 90 },
];

const activities = [
  ["🍳", "Cook Together — Paneer Challenge", "Food · Cooking", "8/12"],
  ["💃", "Dance Break — Bollywood", "Dance · Music", "11/20"],
  ["🥾", "Weekend Trek Planning", "Trekking · Outdoors", "14/18"],
  ["📸", "Delhi Street Photo Walk", "Photography · City", "9/12"],
  ["🌱", "Balcony Garden Show & Tell", "Gardening · Nature", "7/10"],
  ["✈️", "Travel Stories & Dream Trips", "Travel · Adventure", "18/25"],
  ["🎨", "Sketch Together", "Art · Creativity", "6/10"],
];

const games = [
  ["🎲", "Rapid Fire + Truth & Dare", "8/12 · 4 active"],
  ["♟️", "Chess Café", "6/8 · 2 playing"],
  ["🎯", "Ludo After Work", "12/16 · 6 active"],
  ["⭕", "Tic-Tac-Toe", "Quick 1-on-1"],
  ["🐍", "Snake Sprint", "Beat the room score"],
  ["🧠", "Rapid Quiz", "5 quick questions"],
];

const music = [
  ["🎤", "Bollywood Karaoke", "14/20 · 5 on stage"],
  ["🎶", "Acoustic Open Mic", "9/15 · 2 singing"],
  ["🎧", "Listen Together — Indie", "18/30 · listening"],
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("discover");
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<Person[]>([]);
  const [discoverProfiles, setDiscoverProfiles] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [toast, setToast] = useState("");
  const [city] = useState("Delhi");
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"login"|"register">("login");
  const [authForm, setAuthForm] = useState({displayName:"",legalName:"",phone:"",email:"",password:"",city:"Delhi",governmentIdType:"AADHAAR",governmentIdLast4:"",gender:"",desiredGender:"FEMALE"});
  const [desiredGender, setDesiredGender] = useState("ANY");
  const [genderSaving, setGenderSaving] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [chatMatch, setChatMatch] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [festival, setFestival] = useState<any>(null);
  const [festivalOpen, setFestivalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loginPopup, setLoginPopup] = useState<any>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [freeVerificationFiles, setFreeVerificationFiles] = useState<Record<string, File | null>>({front:null,left:null,right:null});
  const [freeVerificationStatus, setFreeVerificationStatus] = useState<"not_started"|"pending"|"verified">("not_started");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraAngle, setCameraAngle] = useState<"front"|"left"|"right">("front");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [profileModal, setProfileModal] = useState<null | "edit" | "privacy" | "feature">(null);
  const [activeFeature, setActiveFeature] = useState({title:"",copy:""});
  const [profileDraft, setProfileDraft] = useState<any>({displayName:"",city:"",state:"",bio:"",gender:"",desiredGender:"ANY",foodPreference:""});
  const [profileSaving, setProfileSaving] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [matchFilters, setMatchFilters] = useState({
  company:"",profession:"",religion:"",community:"",ageMin:"18",ageMax:"60",
  gender:"",city:"",state:"",distance:"",food:"",diet:"",smoking:"",drinking:"",
  relationshipGoal:"",education:"",children:"",pets:"",exercise:"",language:"",heightMin:"",heightMax:"",verified:"",photos:""
});
  const [profileOnboarding, setProfileOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string,number>>({});
  useEffect(() => { fetch("/api/me").then(r=>r.json()).then(d=>{if(d.authenticated)setUser(d);}).finally(()=>setAuthChecked(true)); }, []);
  useEffect(() => {
    if(!user) return;
    const prefs=user?.profile?.lifestylePreferences||{};
    setDesiredGender(String(prefs.desiredGender||"ANY").toUpperCase());
    const complete=!!user?.profile?.displayName && !!user?.profile?.city && !!prefs.state && !!prefs.gender && !!prefs.desiredGender && String(user?.profile?.bio||"").trim().length>=10;
    setProfileOnboarding(!complete);
    setOnboardingChecked(true);
  }, [user]);
  useEffect(() => { if(!user) return; try { const raw=localStorage.getItem("cuddl_free_verification"); if(raw) setFreeVerificationStatus(JSON.parse(raw).status || "not_started"); } catch {} }, [user]);
  useEffect(() => {
    if(!user)return;
    registerChatPublicKey().catch(() => notify("Secure chat setup needs browser storage permission."));
    Promise.all([fetch("/api/discover"),fetch("/api/matches"),fetch("/api/festival"),fetch("/api/notifications")]).then(async ([a,m,f,n])=>{
      const [ad,md,fd,nd]=await Promise.all([a.json(),m.json(),f.json(),n.json()]);
      if(Array.isArray(ad.profiles))setDiscoverProfiles(ad.profiles);
      if(Array.isArray(md.matches))setMatches(md.matches);
      if(fd?.live) setFestival(fd); else {setFestival(null);setFestivalOpen(false);}
      if(Array.isArray(nd.notifications)){
        setNotifications(nd.notifications);
        const popup=nd.notifications.find((x:any)=>x.showPopup&&!x.read);
        if(popup) setLoginPopup(popup);
      }
    });
  }, [user]);
  useEffect(() => {
    if(!user || !chatMatch?.matchId) return;
    const timer=window.setInterval(async()=>{
      try{
        try { await loadEncryptedChat(chatMatch.matchId); } catch {}
      }catch{}
    },4000);
    return ()=>window.clearInterval(timer);
  }, [user, chatMatch?.matchId]);
  async function markNotificationRead(id:string){
    setNotifications(current=>current.map(n=>n.id===id?{...n,read:true}:n));
    await fetch("/api/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  }
  async function openNotification(n:any){
    await markNotificationRead(n.id);
    setNotificationOpen(true);
  }
  async function closeLoginPopup(n:any){
    await markNotificationRead(n.id);
    setLoginPopup(null);
  }
  async function refreshFestival(){
    const r=await fetch("/api/festival",{cache:"no-store"});
    const d=await r.json();
    if(d?.live) setFestival(d); else {setFestival(null);setFestivalOpen(false);}
  }
  async function openFestival(){
    await refreshFestival();
    setFestivalOpen(true);
  }
  useEffect(() => { if(!user)return; const t=window.setInterval(()=>{refreshFestival()},30000); return ()=>window.clearInterval(t); }, [user]);
  useEffect(() => { if(!user)return; const t=window.setInterval(async()=>{const r=await fetch("/api/notifications",{cache:"no-store"});const d=await r.json();if(Array.isArray(d.notifications))setNotifications(d.notifications)},30000); return ()=>window.clearInterval(t); }, [user]);
  useEffect(() => { if(!user)return; fetch("/api/discover").then(r=>r.json()).then(d=>{if(Array.isArray(d.profiles))setDiscoverProfiles(d.profiles);}); fetch("/api/matches").then(r=>r.json()).then(d=>{if(Array.isArray(d.matches))setMatches(d.matches);}); }, [user]);
  const passwordChecks = useMemo(() => ({length: authForm.password.length >= 8, upper: /[A-Z]/.test(authForm.password), lower: /[a-z]/.test(authForm.password), number: /[0-9]/.test(authForm.password), special: /[^A-Za-z0-9]/.test(authForm.password)}), [authForm.password]);
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordStrength = authForm.password.length===0 ? "" : Object.values(passwordChecks).filter(Boolean).length <= 2 ? "Weak" : Object.values(passwordChecks).filter(Boolean).length < 5 ? "Medium" : "Strong";
  async function submitAuth(e: React.FormEvent) { e.preventDefault(); setAuthBusy(true); setAuthError(""); if(authMode==="register" && !passwordValid){ setAuthBusy(false); setAuthError("Password does not meet all requirements. Please complete the items shown below."); return; } const endpoint=authMode==="login"?"/api/auth/login":"/api/auth/register"; const payload=authMode==="login"?{email:authForm.email,password:authForm.password}:authForm; try { const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Authentication failed"); setUser(await fetch("/api/me").then(x=>x.json())); if(authMode==="register"){setProfileOnboarding(true);setTab("discover");} } catch(err){setAuthError(err instanceof Error?err.message:"Authentication failed");} finally{setAuthBusy(false);} }
  async function saveDiscoveryPreference(value:string){ setDesiredGender(value); setGenderSaving(true); try { const r=await fetch("/api/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({desiredGender:value})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Could not save preference"); setUser((current:any)=>current?{...current,profile:d.profile}:current); const a=await fetch("/api/discover",{cache:"no-store"}); const ad=await a.json(); if(Array.isArray(ad.profiles)) { setDiscoverProfiles(ad.profiles); setIndex(0); setPhotoIndexes({}); } notify(value==="ANY"?"Showing all genders":"Showing "+value.toLowerCase().replace("_"," ")+" profiles"); } catch(err){ notify(err instanceof Error?err.message:"Could not save preference"); } finally { setGenderSaving(false); } }
  function openProfileEditor(){
    const p=user?.profile||{};
    const lp=p.lifestylePreferences||{};
    setProfileDraft({displayName:String(p.displayName||""),city:String(p.city||""),state:String(lp.state||""),bio:String(p.bio||""),gender:String(lp.gender||""),desiredGender:String(lp.desiredGender||"ANY"),foodPreference:String(lp.foodPreference||"")});
    setProfileModal("edit");
  }
  async function saveProfile(){
    if(profileSaving)return;
    setProfileSaving(true);
    try{
      const r=await fetch("/api/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(profileDraft)});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Could not save profile");
      setUser((current:any)=>current?{...current,profile:d.profile}:current);
      const lp=d.profile?.lifestylePreferences||{};
      const complete=!!d.profile?.displayName && !!d.profile?.city && !!lp.state && !!lp.gender && !!lp.desiredGender && String(d.profile?.bio||"").trim().length>=10;
      setProfileOnboarding(!complete);
      setProfileModal(complete?null:"edit");
      if(complete){setTab("discover");notify("Profile complete — welcome to Discover");} else notify("Please complete the required profile details");
    }catch(err){notify(err instanceof Error?err.message:"Could not save profile");}
    finally{setProfileSaving(false);}
  }
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});setUser(null);setChatMatch(null);notify("Signed out");}
  async function loadEncryptedChat(matchId:string){
    const r=await fetch("/api/messages?matchId="+encodeURIComponent(matchId),{cache:"no-store"});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||"Could not load chat");
    const rows=Array.isArray(d.messages)?d.messages:[];
    const decrypted=await Promise.all(rows.map(async (message:any)=>{
      if(message.metadata?.encrypted!==true || !message.body || !message.senderPublicKey){
        return {...message,body:message.metadata?.legacy ? "[Older message is not available in encrypted chat]" : ""};
      }
      try{
        const body=await decryptChatMessage(message.body,message.metadata.iv,message.senderPublicKey);
        return {...message,body};
      }catch{
        return {...message,body:"[Unable to decrypt this message on this device]"};
      }
    }));
    setChatMessages(decrypted);
  }
  async function openChat(match:any){
    if(!match?.matchId && !match?.id) return;
    const matchId=match.matchId||match.id;
    const otherId=match.otherUserId || (match.userAId===user?.user?.id ? match.userBId : match.userAId);
    setChatMatch({...match,matchId,otherUserId:otherId});
    setChatMessages([]);
    try { await loadEncryptedChat(matchId); }
    catch(err) { notify(err instanceof Error?err.message:"Could not load secure chat"); }
  }
  async function sendMessage(e?:React.FormEvent){
    e?.preventDefault();
    const text=chatText.trim();
    if(!text || !chatMatch?.matchId || !chatMatch?.otherUserId || chatBusy) return;
    setChatBusy(true);
    try {
      const keyResponse=await fetch("/api/keys?userIds="+encodeURIComponent(chatMatch.otherUserId),{cache:"no-store"});
      const keyData=await keyResponse.json();
      const recipient=Array.isArray(keyData.keys)?keyData.keys[0]:null;
      if(!recipient?.publicKeyJwk) throw new Error("Your match has not enabled secure chat on this device yet.");
      const encrypted=await encryptChatMessage(text,recipient.publicKeyJwk);
      const r=await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({matchId:chatMatch.matchId,...encrypted})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Could not send encrypted message");
      setChatMessages(current=>[...current,{...d.message,body:text}]);
      setChatText("");
    } catch(err) { notify(err instanceof Error?err.message:"Could not send encrypted message"); }
    finally { setChatBusy(false); }
  }
  const searchableProfiles = useMemo(() => {
    const cityCoords:any={Delhi:[28.6139,77.2090],Gurugram:[28.4595,77.0266],Noida:[28.5355,77.3910],Mumbai:[19.0760,72.8777],Bengaluru:[12.9716,77.5946],Bangalore:[12.9716,77.5946],Pune:[18.5204,73.8567],Jaipur:[26.9124,75.7873],Hyderabad:[17.3850,78.4867],Chandigarh:[30.7333,76.7794]};
    const km=(a:any,b:any)=>{if(!a||!b)return null;const R=6371,rad=(x:number)=>x*Math.PI/180;const dLat=rad(b[0]-a[0]),dLon=rad(b[1]-a[1]);const q=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));};
    const currentCity=String(user?.profile?.city||"Delhi");
    const origin=cityCoords[currentCity]||null;
    const text=(v:any)=>String(v??"").toLowerCase().trim();
    const has=(v:any,q:string)=>!q||text(v).includes(text(q));
    return discoverProfiles.filter((p:any)=>{
      const lp=p.lifestylePreferences||{};
      const age=Number(p.age||0);
      const minAge=Number(matchFilters.ageMin||18), maxAge=Number(matchFilters.ageMax||60);
      if(age && (age<minAge||age>maxAge)) return false;
      if(matchFilters.gender && text(lp.gender)!==text(matchFilters.gender)) return false;
      if(!has(p.city,matchFilters.city)) return false;
      if(!has(lp.state,matchFilters.state)) return false;
      if(!has(lp.company,matchFilters.company)||!has(lp.profession,matchFilters.profession)||!has(lp.religion,matchFilters.religion)||!has(lp.community,matchFilters.community)) return false;
      if(!has(lp.foodPreference||lp.food,matchFilters.food)||!has(lp.diet,matchFilters.diet)||!has(lp.smoking,matchFilters.smoking)||!has(lp.drinking,matchFilters.drinking)) return false;
      if(!has(lp.relationshipGoal||lp.relationshipGoals,matchFilters.relationshipGoal)||!has(lp.education,matchFilters.education)||!has(lp.children,matchFilters.children)||!has(lp.pets,matchFilters.pets)||!has(lp.exercise,matchFilters.exercise)||!has(lp.language||lp.languages,matchFilters.language)) return false;
      if(matchFilters.heightMin && Number(lp.heightCm||lp.height||0)<Number(matchFilters.heightMin)) return false;
      if(matchFilters.heightMax && Number(lp.heightCm||lp.height||0)>Number(matchFilters.heightMax)) return false;
      if(matchFilters.verified==="yes" && lp.verified!==true && p.verified!==true) return false;
      if(matchFilters.photos==="yes" && !((Array.isArray(lp.photos)&&lp.photos.length)||p.avatarUrl)) return false;
      if(matchFilters.distance){
        const target=cityCoords[String(p.city||"")];
        const distance=origin&&target?km(origin,target):typeof lp.distanceKm==="number"?lp.distanceKm:null;
        if(distance===null || distance>Number(matchFilters.distance)) return false;
      }
      return true;
    });
  }, [discoverProfiles,matchFilters,user]);
  const person = useMemo(() => searchableProfiles.length ? searchableProfiles[index % searchableProfiles.length] : null, [index, searchableProfiles]);
  const personPhotos = useMemo(() => {
    const p:any=person||{};
    const lp=p.lifestylePreferences||{};
    const photos=Array.isArray(lp.photos)?lp.photos.filter(Boolean):[];
    return Array.from(new Set([p.avatarUrl,...photos].filter(Boolean)));
  }, [person]);
  function changePhoto(id:string,total:number,delta:number){setPhotoIndexes(v=>({...v,[id]:((v[id]||0)+delta+total)%total}));}
  const clearSearchFilters=()=>{setMatchFilters({company:"",profession:"",religion:"",community:"",ageMin:"18",ageMax:"60",gender:"",city:"",state:"",distance:"",food:"",diet:"",smoking:"",drinking:"",relationshipGoal:"",education:"",children:"",pets:"",exercise:"",language:"",heightMin:"",heightMax:"",verified:"",photos:""});setIndex(0);setPhotoIndexes({});};
  const filterField=(key:string,label:string,options?:string[])=> options
    ? <select className="field" value={(matchFilters as any)[key]} onChange={e=>setMatchFilters({...matchFilters,[key]:e.target.value})}><option value="">{label}</option>{options.map(x=><option key={x} value={x}>{x}</option>)}</select>
    : <input className="field" placeholder={label} value={(matchFilters as any)[key]} onChange={e=>setMatchFilters({...matchFilters,[key]:e.target.value})}/>;
  

  async function startFreeCamera(angle:"front"|"left"|"right"=cameraAngle){
    if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){notify("Camera needs a secure HTTPS page and a supported browser");return;}
    setCameraAngle(angle); setCameraBusy(true);
    try{
      cameraStream?.getTracks().forEach(t=>t.stop());
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:false});
      setCameraStream(stream);
      setTimeout(()=>{if(cameraVideoRef.current){cameraVideoRef.current.srcObject=stream;cameraVideoRef.current.play().catch(()=>{});}},0);
    }catch(err){notify(err instanceof DOMException && err.name==="NotAllowedError"?"Camera permission was denied":"Could not open camera");}
    finally{setCameraBusy(false);}
  }
  function stopFreeCamera(){
    cameraStream?.getTracks().forEach(t=>t.stop()); setCameraStream(null);
    if(cameraVideoRef.current) cameraVideoRef.current.srcObject=null;
  }
  async function captureFreeCamera(){
    const video=cameraVideoRef.current, canvas=cameraCanvasRef.current;
    if(!video||!canvas||!cameraStream){notify("Start the camera first");return;}
    canvas.width=video.videoWidth||720; canvas.height=video.videoHeight||720;
    const ctx=canvas.getContext("2d"); if(!ctx){notify("Camera capture unavailable");return;}
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",0.88));
    if(!blob){notify("Could not capture image");return;}
    const file=new File([blob],`cuddl-${cameraAngle}.jpg`,{type:"image/jpeg"});
    setFreeVerificationFiles(v=>({...v,[cameraAngle]:file})); stopFreeCamera();
    if(cameraAngle==="front")setCameraAngle("left");else if(cameraAngle==="left")setCameraAngle("right");
    notify(`${cameraAngle} selfie captured`);
  }

  const allFreeVerificationCaptured = !!freeVerificationFiles.front && !!freeVerificationFiles.left && !!freeVerificationFiles.right;

  async function submitFreeVerification(){
    if(verificationSubmitting)return;
    const keys=["front","left","right"] as const;
    if(keys.some(k=>!freeVerificationFiles[k])){notify("Please capture all 3 selfie angles");return;}
    setVerificationSubmitting(true);
    try{
      const captures:any={};
      for(const key of keys){
        const file=freeVerificationFiles[key];
        if(!file) continue;
        const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
        captures[key]={hash:Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join(""),size:file.size,type:file.type};
      }
      const uploaded:any={};
      for(const key of keys){
        const file=freeVerificationFiles[key];
        if(!file) continue;
        const blob=await upload(`verification/${user?.user?.id||user?.id}/${key}-${Date.now()}.jpg`,file,{
          access:"private",
          handleUploadUrl:"/api/verification/upload",
          clientPayload:JSON.stringify({angle:key})
        });
        uploaded[key]={pathname:blob.pathname,hash:captures[key].hash,size:file.size,type:file.type};
      }
      const submit=await fetch("/api/verification/free",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({captures:uploaded})});
      const result=await submit.json();
      if(!submit.ok) throw new Error(result.error||"Could not submit verification");
      localStorage.setItem("cuddl_free_verification",JSON.stringify({status:"pending",submittedAt:new Date().toISOString(),captures:Object.fromEntries(keys.map(k=>[k,{hash:captures[k].hash,size:captures[k].size,type:captures[k].type}]))}));
      setFreeVerificationStatus("pending");
      setFreeVerificationFiles({front:null,left:null,right:null});
      notify("Verification captures securely uploaded and submitted");
    }catch(err){notify(err instanceof Error ? err.message : "Could not prepare verification");}
    finally{setVerificationSubmitting(false);}
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1700);
  }

  function spark() {
    if(person?.isTestProfile){ setIndex(current=>current+1); notify("Test profile skipped — demo data only"); return; }
    const name=person?.displayName||person?.name||"profile";
    setLiked((current) => current.some((p:any) => (p.displayName||p.name) === name) ? current : [...current, person]);
    setIndex((current) => current + 1);
    notify("Spark sent 💗");
  }

  const nav = [["discover","♡","Discover"],["lounge","🎮","Lounge"],["matches","◌","Matches"],["dates","✦","Dates"],["profile","☺","Profile"]] as const;

  if (!authChecked) return <div className="cuddl-app"><main className="content"><div className="panel"><b>Loading Cuddl…</b><p className="sub">Checking your secure session.</p></div></main></div>;
  if (!user) return <div className="cuddl-app"><main className="content auth-screen"><div className="brand auth-brand">Cuddl</div><div className="eyebrow">Activity-first social dating</div><h1 className="hero-title">{authMode==="login"?"Welcome back.":"Create your Cuddl account."}</h1><p className="sub">{authMode==="login"?"Meet through activities, games, music and real conversations.":"One real identity per person. Verification is required for trust and safety."}</p><form className="panel auth-form" onSubmit={submitAuth}>
{authMode==="register" && <>
<input className="field" placeholder="Profile name" value={authForm.displayName} onChange={e=>setAuthForm({...authForm,displayName:e.target.value})} required />
<input className="field" placeholder="Full legal name (as on ID)" value={authForm.legalName} onChange={e=>setAuthForm({...authForm,legalName:e.target.value})} required autoComplete="name" />
<input className="field" type="tel" placeholder="Phone number" value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:e.target.value})} required autoComplete="tel" />
<input className="field" placeholder="City" value={authForm.city} onChange={e=>setAuthForm({...authForm,city:e.target.value})} required />
<div className="profile-row"><select className="field" value={authForm.gender} onChange={e=>setAuthForm({...authForm,gender:e.target.value})} required aria-label="Your gender"><option value="">Your gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option></select><select className="field" value={authForm.desiredGender} onChange={e=>setAuthForm({...authForm,desiredGender:e.target.value})} required aria-label="Who you want to discover"><option value="FEMALE">Women</option><option value="MALE">Men</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option><option value="ANY">Everyone</option></select></div>
<div className="profile-row"><select className="field" value={authForm.governmentIdType} onChange={e=>setAuthForm({...authForm,governmentIdType:e.target.value})} aria-label="Government ID type"><option value="AADHAAR">Aadhaar</option><option value="PAN">PAN</option><option value="PASSPORT">Passport</option><option value="DRIVING_LICENSE">Driving licence</option><option value="VOTER_ID">Voter ID</option><option value="OTHER">Other government ID</option></select><input className="field" inputMode="numeric" maxLength={4} placeholder="ID last 4 digits" value={authForm.governmentIdLast4} onChange={e=>setAuthForm({...authForm,governmentIdLast4:e.target.value.replace(/\\D/g,"").slice(0,4)})} required /></div>
<div className="safe">🔐 Cuddl should send the complete ID and live front/left/right selfie capture only to the configured identity-verification provider. The app database stores only the minimum verification metadata needed for the account.</div>
</>}
<input className="field" type="email" placeholder="Email address" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} required autoComplete="email" />
<input className="field" type="password" minLength={8} placeholder="Password" value={authForm.password} onChange={e=>{setAuthForm({...authForm,password:e.target.value});setAuthError("");}} required autoComplete={authMode==="login"?"current-password":"new-password"} />
{authMode==="register" && <div className="password-requirements"><div className="password-head"><b>Password requirements</b>{passwordStrength && <span className={"password-strength "+passwordStrength.toLowerCase()}>{passwordStrength}</span>}</div><div className="password-meter"><span style={{width: passwordStrength==="Strong"?"100%":passwordStrength==="Medium"?"66%":passwordStrength==="Weak"?"33%":"0%"}} /></div><div className="password-rules"><div className={passwordChecks.length?"valid":""}>{passwordChecks.length?"✓":"○"} At least 8 characters</div><div className={passwordChecks.upper?"valid":""}>{passwordChecks.upper?"✓":"○"} One uppercase letter (A–Z)</div><div className={passwordChecks.lower?"valid":""}>{passwordChecks.lower?"✓":"○"} One lowercase letter (a–z)</div><div className={passwordChecks.number?"valid":""}>{passwordChecks.number?"✓":"○"} One number (0–9)</div><div className={passwordChecks.special?"valid":""}>{passwordChecks.special?"✓":"○"} One special character (!@#$%^&*)</div></div></div>}
{authError && <div className="auth-error">{authError}</div>}
{authMode==="register" && <div className="safe">Identity status starts as <b>Pending</b>. Account access should remain limited until the verification provider confirms the required live selfie and government-ID checks.</div>}
<button className="btn" disabled={authBusy}>{authBusy?"Please wait…":authMode==="login"?"Sign in":"Create account & verify"}</button></form>{authMode==="login" && <button type="button" className="forgot-link" onClick={()=>{setForgotEmail(authForm.email);setForgotOpen(true);}}>Forgot password?</button>}<button className="btn ghost auth-switch" onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setAuthError("");}}>{authMode==="login"?"New to Cuddl? Create an account":"Already have an account? Sign in"}</button></main></div>;

  return (
    <div className="cuddl-app">
      <header className="topbar">
        <div className="brand">Cuddl</div>
        <button className="icon-btn" aria-label="Safety Center" onClick={() => notify("Safety Center ready")}>♡</button>
      </header>

      <main className="content">
        {festival && <button className="festival-banner" onClick={openFestival}><span>{festival.festival.coverEmoji}</span><div><b>{festival.festival.name} is live</b><small>{festival.festival.tagline || "Roam freely between special activities for a limited time."}</small></div><strong>Explore →</strong></button>}
        {tab === "discover" && <>
          <div className="eyebrow">Smart discovery</div>
          <h1 className="hero-title">Find the right people for you.</h1>
          <p className="sub">Use as many filters as you like. More meaningful preferences can make discovery more relevant.</p>

          <section className="panel search-panel">
            <div className="search-panel-head"><div><div className="eyebrow">Search & filters</div><b>Refine your discovery</b></div><span className="safe">{searchableProfiles.length} profiles</span></div>
            <div className="filter-section-title">Basics</div>
            <div className="filter-grid">
              {filterField("ageMin","Min age")}
              {filterField("ageMax","Max age")}
              {filterField("gender","Gender",["MALE","FEMALE","NON_BINARY","OTHER"])}
              {filterField("city","City")}
              {filterField("state","State")}
              {filterField("distance","Within km",["5","10","25","50","100","250"])}
            </div>
            <div className="filter-section-title">Work & background</div>
            <div className="filter-grid">
              {filterField("company","Company")}
              {filterField("profession","Profession")}
              {filterField("religion","Religion")}
              {filterField("community","Community")}
              {filterField("education","Education")}
              {filterField("relationshipGoal","Relationship goal")}
            </div>
            <div className="filter-section-title">Lifestyle</div>
            <div className="filter-grid">
              {filterField("food","Food preference")}
              {filterField("diet","Diet",["Vegetarian","Vegan","Eggetarian","Jain","Non-vegetarian","Anything"])}
              {filterField("smoking","Smoking",["Never","Occasionally","Regularly","Prefer not to say"])}
              {filterField("drinking","Drinking",["Never","Occasionally","Socially","Regularly","Prefer not to say"])}
              {filterField("children","Children",["Want children","Have children","Do not want","Open to it"])}
              {filterField("pets","Pets",["Love pets","Have pets","No pets","Open to pets"])}
              {filterField("exercise","Exercise",["Daily","Often","Sometimes","Rarely"])}
              {filterField("language","Language")}
            </div>
            <div className="filter-section-title">Physical & trust</div>
            <div className="filter-grid">
              {filterField("heightMin","Min height (cm)")}
              {filterField("heightMax","Max height (cm)")}
              {filterField("verified","Identity",["yes",""])}
              {filterField("photos","Photos",["yes",""])}
            </div>
            <div className="actions"><button className="btn ghost" onClick={clearSearchFilters}>Clear all</button><span className="safe">Filters apply instantly</span></div>
          </section>

          {searchableProfiles.length > 0 && <section className="panel single-profile-panel">
            <div className="eyebrow">Profile</div>
            <div className="discover-photo">
              {personPhotos.length ? <img src={personPhotos[photoIndexes[person.id]||0]} alt={person.displayName||person.name||"Cuddl profile"} /> : <div className="discover-avatar">{person.initial}</div>}
              {personPhotos.length>1 && <><button className="photo-arrow left" onClick={()=>changePhoto(person.id||person.name,personPhotos.length,-1)} aria-label="Previous photo">‹</button><button className="photo-arrow right" onClick={()=>changePhoto(person.id||person.name,personPhotos.length,1)} aria-label="Next photo">›</button><span className="photo-count">{(photoIndexes[person.id||person.name]||0)+1}/{personPhotos.length} photos</span></>}
            </div>
            <div className="profile-row profile-heading"><div className="grow"><h2 style={{margin:"4px 0"}}>{person.displayName ?? person.name}{person.age ? `, ${person.age}` : ""} ✓</h2><div className="sub">⌖ {person.city || "Location hidden"} · Active today</div></div><span className="score">{person.score||88}%</span></div>
            <p className="profile-bio">{person.bio || "No bio added yet."}</p>
            <div className="detail-grid">
              <div><small>Company</small><b>{person.lifestylePreferences?.company||"—"}</b></div>
              <div><small>Profession</small><b>{person.lifestylePreferences?.profession||"—"}</b></div>
              <div><small>Religion</small><b>{person.lifestylePreferences?.religion||"—"}</b></div>
              <div><small>Community</small><b>{person.lifestylePreferences?.community||"—"}</b></div>
              <div><small>Food</small><b>{person.lifestylePreferences?.foodPreference||person.lifestylePreferences?.food||"—"}</b></div>
              <div><small>Diet</small><b>{person.lifestylePreferences?.diet||"—"}</b></div>
              <div><small>Relationship goal</small><b>{person.lifestylePreferences?.relationshipGoal||"—"}</b></div>
              <div><small>Education</small><b>{person.lifestylePreferences?.education||"—"}</b></div>
              <div><small>Children</small><b>{person.lifestylePreferences?.children||"—"}</b></div>
              <div><small>Pets</small><b>{person.lifestylePreferences?.pets||"—"}</b></div>
              <div><small>Smoking</small><b>{person.lifestylePreferences?.smoking||"—"}</b></div>
              <div><small>Drinking</small><b>{person.lifestylePreferences?.drinking||"—"}</b></div>
            </div>
            <div className="profile-tags">{(person.tags||[]).map((t:string)=><span className="tag" key={t}>{t}</span>)}</div>
            <div className="actions profile-actions"><button className="btn ghost" onClick={() => {setIndex(i=>i+1);notify("Passed — suggestions tuned");}}>Pass</button><button className="btn" onClick={spark}>♥ Send Spark</button></div>
          </section>}

          {!searchableProfiles.length && <div className="panel"><b>No profiles match these filters.</b><p className="sub">Try widening age, distance, city or lifestyle preferences.</p><button className="btn ghost" onClick={clearSearchFilters}>Clear filters</button></div>}
        </>}

        {tab === "lounge" && <>
          <div className="eyebrow">Cuddl Social Lounge</div>
          <h1 className="hero-title">Meet through what you love.</h1>
          <p className="sub">Activity is the starting point. Chemistry is what you discover along the way.</p>
          <div className="chips">{["All","Activities","Games","Music","Social"].map(x => <button className="chip active" key={x}>{x}</button>)}</div>

          <section className="panel">
            <b>✨ Find someone who...</b><p className="sub">Pick an activity you want to share.</p>
            <div className="chips" style={{flexWrap:"wrap",overflow:"visible"}}>
              {["🎵 Sing","🥾 Trek","🍳 Cook","💃 Dance","📸 Photograph","✈️ Travel","🌱 Garden","🏙️ Explore","📚 Read","🏸 Play"].map(x => <button className="chip" key={x} onClick={() => notify("Finding people for " + x.slice(2) + "…")}>{x}</button>)}
            </div>
          </section>

          <div className="eyebrow" style={{marginTop:18}}>Activities</div>
          {activities.map(([icon,name,tags,count]) => <div className="room" key={name}><div className="room-top"><div className="room-icon">{icon}</div><div className="grow"><b>{name}</b><div className="room-meta">{count} · participants active</div></div><button className="join" onClick={() => notify("Joined " + name)}>Join</button></div><div className="room-meta">{tags} · camera optional · spectator mode</div></div>)}

          <div className="eyebrow" style={{marginTop:18}}>Games</div>
          {games.map(([icon,name,meta]) => <div className="room" key={name}><div className="room-top"><div className="room-icon">{icon}</div><div className="grow"><b>{name}</b><div className="room-meta">{meta}</div></div><button className="join" onClick={() => notify("Joined " + name)}>Play</button></div></div>)}

          <div className="eyebrow" style={{marginTop:18}}>Music</div>
          {music.map(([icon,name,meta]) => <div className="room" key={name}><div className="room-top"><div className="room-icon">{icon}</div><div className="grow"><b>{name}</b><div className="room-meta">{meta}</div></div><button className="join" onClick={() => notify("Joined " + name)}>Join</button></div><div className="room-meta">🎥 Camera optional · 🎙️ Mic optional · 🎉 Cheer = appreciation · Spark = romantic interest</div></div>)}
        </>}

        {tab === "matches" && <>
          <div className="eyebrow">Mutual connections</div><h1 className="hero-title">Your matches.</h1><p className="sub">Continue chemistry through chat, games, calls or a real-world activity.</p>
          {(matches.length ? matches.map(m=>({name:m.other?.displayName||"Match",age:0,city:m.other?.city||"",initial:(m.other?.displayName||"M")[0],score:0,matchId:m.id})) : liked.map(p=>({...p,matchId:undefined}))).map((p:any) => <div className="panel" key={p.matchId||p.name}><div className="profile-row"><div className="avatar">{p.initial}</div><div className="grow"><b>{p.name}{p.age ? ", "+p.age : ""} ✓</b><div className="sub">{p.city || "Cuddl"}{p.score ? " · "+p.score+"% compatibility" : " · mutual connection"}</div></div></div><div className="actions"><button className="btn" onClick={() => openChat(p)} disabled={!p.matchId}>Chat</button><button className="btn ghost" onClick={() => {setTab("lounge");notify("Play with " + p.name)}}>Play</button><button className="btn ghost" onClick={() => notify("Profile opened")}>Profile</button></div></div>)}
          {chatMatch && <div className="panel chat-panel">
            <div className="profile-row"><button className="icon-btn" onClick={()=>setChatMatch(null)} aria-label="Close chat">‹</button><div className="avatar">{chatMatch.initial}</div><div className="grow"><b>{chatMatch.name}</b><div className="sub">Matched on Cuddl · 🔒 end-to-end encrypted</div></div></div>
            <div className="chat-list">
              {chatMessages.length===0 && <div className="chat-empty">Start the conversation. Ask about a shared activity, song, game or place.</div>}
              {chatMessages.map(m=><div key={m.id} className={m.senderId===user?.user?.id||m.senderId===user?.id?"bubble mine":"bubble"}>{m.body}</div>)}
            </div>
            <form className="chat-compose" onSubmit={sendMessage}><input className="field" value={chatText} onChange={e=>setChatText(e.target.value)} maxLength={2000} placeholder="Write a message…" /><button className="btn" disabled={chatBusy||!chatText.trim()}>{chatBusy?"…":"Send"}</button></form>
          </div>}
          <div className="panel"><b>✦ AI Wingman</b><p className="sub">Suggestions only. Cuddl never sends a message without your approval.</p><button className="btn" onClick={() => notify("Opener suggestion created")}>Create opener</button></div>
        </>}

        {tab === "dates" && <>
          <div className="eyebrow">Date Studio</div><h1 className="hero-title">Turn a connection into a memory.</h1><p className="sub">Build low-pressure plans around shared interests, budget and city.</p>
          <div className="panel"><b>✦ Chemistry Date</b><p className="sub">Café + live acoustic set · 90 min · ₹800–₹1,200 · public venue</p><button className="btn" onClick={() => notify("3 date ideas created ✦")}>Create ideas</button></div>
          <div className="panel"><b>🛟 Date Safety</b><p className="sub">Share plan, trusted contact and arrival check-in.</p><button className="btn ghost" onClick={() => notify("Safety Center opened")}>Open Safety Center</button></div>
          <div className="panel"><b>💌 Date Capsule</b><p className="sub">Both answer one question. Answers unlock together after the date.</p><button className="btn ghost" onClick={() => notify("Capsule created")}>Create capsule</button></div>
        </>}

        {tab === "profile" && <>
          <div className="eyebrow">Your space · {city}</div><h1 className="hero-title">Profile, privacy & trust.</h1>
          <div className="panel"><div className="profile-row"><div className="avatar">S</div><div><b>Your profile</b><div className="sub">82% complete · Add voice intro</div></div></div><div className="actions"><button className="btn" onClick={openProfileEditor}>Edit profile</button><button className="btn ghost" onClick={() => setMediaOpen(true)}>Photos & videos</button><button className="btn ghost" onClick={() => setVerificationOpen(true)}>{freeVerificationStatus==="verified"?"✓ Identity verified":freeVerificationStatus==="pending"?"Verification pending":"Verify identity"}</button><button className="btn ghost" onClick={logout}>Sign out</button></div></div>
          <div className="panel"><b>Privacy controls</b><p className="safe">Incognito · block contacts · private albums · activity visibility. Native mobile builds can use platform screenshot protections; browsers cannot guarantee screenshot prevention.</p><button className="btn ghost" onClick={() => setProfileModal("privacy")}>Manage privacy</button></div>
          <div className="grid">
            {[
              ["🧭","Relationship Compass","Compare goals, communication and lifestyle preferences."],
              ["🙈","Blind Vibe","Interact before photos are fully revealed."],
              ["🧠","Memory Match","Save facts from conversations without inventing them."],
              ["🛂","Connection Passport","Private timeline of shared Cuddl moments."],
              ["🌡️","Connection Health","Interaction signals, not relationship certainty."],
              ["✨","Serendipity Mode","One surprise discovery outside your usual filters."],
            ].map(([icon,title,copy]) => <button className="card" key={title} onClick={() => {setActiveFeature({title,copy});setProfileModal("feature");}}><b>{icon} {title}</b><span>{copy}</span></button>)}
          </div>
        </>}
      </main>

      {verificationOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Free identity check</div><h2>{freeVerificationStatus==="pending"?"Verification pending":"Verify with your camera"}</h2>
        <p className="sub">Capture three guided selfie angles. Captures are uploaded to private temporary storage for review. They are deleted automatically after a final verification decision; this free mode does not perform government-ID authenticity or biometric matching.</p>
        <div className="panel" style={{padding:12}}>
          <div className="camera-stage">
          <video ref={cameraVideoRef} autoPlay playsInline muted style={{width:"100%",borderRadius:16,background:"#111",display:cameraStream?"block":"none",transform:"scaleX(-1)"}} />
          {cameraStream && <div className="camera-guide-overlay"><div className={"face-shadow "+cameraAngle}><span></span></div><b>{cameraAngle==="front"?"Look straight at the guide":cameraAngle==="left"?"Turn slightly left":"Turn slightly right"}</b><small>Keep your face inside the box and match the black shadow.</small></div>}
          {!cameraStream&&<div className="camera-guide-preview"><div className={"face-shadow "+cameraAngle}><span></span></div><b>Next: {cameraAngle} selfie</b><small>Match the black shadow when the camera opens.</small></div>}
        </div>
          
          <canvas ref={cameraCanvasRef} style={{display:"none"}} />
          <div className="actions">{!cameraStream?<button className="btn" disabled={freeVerificationStatus==="pending"||cameraBusy||allFreeVerificationCaptured} onClick={()=>startFreeCamera(cameraAngle)}>{freeVerificationStatus==="pending"?"Verification submitted ✓":allFreeVerificationCaptured?"All selfies captured ✓":cameraBusy?"Opening camera…":`Start ${cameraAngle} camera`}</button>:<button className="btn" onClick={captureFreeCamera} disabled={freeVerificationStatus==="pending"||allFreeVerificationCaptured}>Capture {cameraAngle}</button>}{cameraStream&&<button className="btn ghost" onClick={stopFreeCamera} disabled={freeVerificationStatus==="pending"||allFreeVerificationCaptured}>Stop camera</button>}</div>
        </div>
        <div className="verification-list">{(["front","left","right"] as const).map(k=><div className="safe" key={k}><b>{k==="front"?"Front":k==="left"?"Left":"Right"} selfie</b> · {freeVerificationFiles[k]?"✓ captured":"not captured"}</div>)}</div>
        <p className="safe">Camera access is permission-based and HTTPS-only; the camera stream is stopped after each capture.</p>
        <button className="btn" disabled={freeVerificationStatus==="pending"||!allFreeVerificationCaptured||verificationSubmitting} onClick={submitFreeVerification}>{freeVerificationStatus==="pending"?"VERIFICATION SUBMITTED":verificationSubmitting?"SUBMITTING…":"SUBMIT VERIFICATION"}</button>
        <div className="safe">Status: <b>{freeVerificationStatus.replace("_"," ")}</b></div>
        <button className="btn ghost" onClick={()=>{stopFreeCamera();setVerificationOpen(false);}}>Close</button>
      </div></div>}

      {mediaOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Profile media rules</div><h2>Your photos & videos</h2>
        <p className="sub">Only media showing you may be added to your dating profile. Group photos, other people, screenshots, memes, downloaded images and misleading media are not permitted.</p>
        <div className="verification-list"><div>✓ Personal photos/videos only</div><div>✓ No group photos</div><div>✓ No impersonation or third-party media</div><div>✓ Uploads can be moderated before appearing</div><div>✓ Download controls will be enforced where the platform supports them</div></div>
        <p className="safe">“Unlimited” profile media is a product policy, but storage and abuse controls still apply. We should not promise unlimited storage without defining fair-use, file-size and retention limits.</p>
        <button className="btn" onClick={()=>notify("Profile media storage is planned separately from verification storage")}>Add media</button>
        <button className="btn ghost" onClick={()=>setMediaOpen(false)}>Close</button>
      </div></div>}
      {profileModal==="edit" && <div className="overlay popup-overlay"><div className="login-popup profile-modal">
        <div className="eyebrow">Edit profile</div><h2>Make your profile yours.</h2>
        <div className="auth-form">
          <input className="field" placeholder="Profile name" value={profileDraft.displayName} onChange={e=>setProfileDraft({...profileDraft,displayName:e.target.value})}/>
          <input className="field" placeholder="City" value={profileDraft.city} onChange={e=>setProfileDraft({...profileDraft,city:e.target.value})} required />
          <textarea className="field profile-textarea" placeholder="Short bio (tell people something real about you)" value={profileDraft.bio} onChange={e=>setProfileDraft({...profileDraft,bio:e.target.value})} minLength={10} required />
          <input className="field" placeholder="State" value={(profileDraft as any).state||""} onChange={e=>setProfileDraft({...profileDraft,state:e.target.value} as any)}/><input className="field" placeholder="Food preference" value={(profileDraft as any).foodPreference||""} onChange={e=>setProfileDraft({...profileDraft,foodPreference:e.target.value} as any)}/><div className="profile-row"><select className="field" value={profileDraft.gender} onChange={e=>setProfileDraft({...profileDraft,gender:e.target.value})}><option value="">Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option></select><select className="field" value={profileDraft.desiredGender} onChange={e=>setProfileDraft({...profileDraft,desiredGender:e.target.value})}><option value="FEMALE">Women</option><option value="MALE">Men</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option><option value="ANY">Everyone</option></select></div>
        </div>
        <button className="btn" onClick={saveProfile} disabled={profileSaving}>{profileSaving?"Saving…":"Save changes"}</button>
        <button className="btn ghost" onClick={()=>setProfileModal(null)}>Close</button>
      </div></div>}
      {profileModal==="privacy" && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Privacy controls</div><h2>Control what you share.</h2>
        <div className="privacy-list"><div><b>Incognito</b><span>Reduce visibility until you choose to interact.</span></div><div><b>Private albums</b><span>Keep selected media behind your approval.</span></div><div><b>Activity visibility</b><span>Control whether activity participation is visible on your profile.</span></div><div><b>Block contacts</b><span>Keep selected contacts out of discovery.</span></div></div>
        <p className="safe">These controls are shown here as the privacy center foundation; persistence for each toggle will be wired into the privacy settings store next.</p>
        <button className="btn ghost" onClick={()=>setProfileModal(null)}>Close</button>
      </div></div>}
      {profileModal==="feature" && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Cuddl feature</div><h2>{activeFeature.title}</h2><p className="sub">{activeFeature.copy}</p>
        <div className="panel"><b>Coming into focus</b><p className="sub">This opens as a dedicated Cuddl experience. Your profile controls remain available while we build the full interaction flow.</p></div>
        <button className="btn" onClick={()=>notify(activeFeature.title+" opened")}>Explore</button>
        <button className="btn ghost" onClick={()=>setProfileModal(null)}>Close</button>
      </div></div>}
      {forgotOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Account access</div><h2>Forgot password?</h2>
        <p className="sub">Enter your registered email. Password reset email delivery is not connected in this test build, so no reset request is sent from this screen.</p>
        <input className="field" type="email" autoComplete="email" placeholder="you@example.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}/>
        <button className="btn" onClick={()=>{setForgotOpen(false);notify(forgotEmail.trim()?"Reset email flow is pending email setup":"Enter your registered email")}}>Continue</button>
        <button className="btn ghost" onClick={()=>setForgotOpen(false)}>Close</button>
      </div></div>}
      {profileOnboarding && onboardingChecked && <div className="overlay popup-overlay onboarding-lock"><div className="login-popup profile-modal">
        <div className="eyebrow">Required before Discover</div><h2>Complete your profile first.</h2>
        <p className="sub">Cuddl will take you to profile search only after these basic details are completed. This prevents browsing other members with an unfinished profile.</p>
        <div className="verification-list"><div>✓ Profile name</div><div>✓ City & state</div><div>✓ Gender & discovery preference</div><div>✓ Short bio (minimum 10 characters)</div></div>
        <button className="btn" onClick={openProfileEditor}>Update my profile</button>
      </div></div>}
      {festivalOpen && festival && <div className="overlay"><div className="festival-sheet">
        <div className="sheet-head"><div><div className="eyebrow">Special occasion · Live now</div><h2>{festival.festival.coverEmoji} {festival.festival.name}</h2><p className="sub">{festival.festival.description || "Move freely from one activity to another. This festival hub disappears when the admin switches it off."}</p></div><button className="icon-btn" onClick={()=>setFestivalOpen(false)}>×</button></div>
        <div className="festival-roam">{festival.activities.map((a:any)=><div className="festival-card" key={a.id}><div className="room-icon">✨</div><div className="grow"><b>{a.name}</b><div className="room-meta">{a.category}{a.city?" · "+a.city:""}{a.capacity?" · "+a.capacity+" spots":""}</div><div className="sub">{a.description || "Join, explore and meet people through this festival activity."}</div></div><button className="join" onClick={()=>notify("Entered "+a.name)}>Enter</button></div>)}</div>
        <div className="panel"><b>Roam freely</b><p className="sub">No permanent festival tab is kept in your account. When the event ends, this special hub disappears automatically.</p></div>
      </div></div>}
      {notificationOpen && <div className="overlay"><div className="notification-sheet">
        <div className="sheet-head"><div><div className="eyebrow">Cuddl notifications</div><h2>Updates for you</h2></div><button className="icon-btn" onClick={()=>setNotificationOpen(false)}>×</button></div>
        {notifications.length===0?<div className="panel"><p className="sub">No notifications yet.</p></div>:notifications.map(n=><button className={"notification-item "+(n.read?"read":"")} key={n.id} onClick={()=>openNotification(n)}><div><b>{n.title}</b><p>{n.body}</p><small>{n.read?"Read":"New"} · {new Date(n.publishedAt).toLocaleString()}</small></div>{!n.read&&<span>●</span>}</button>)}
      </div></div>}
      {loginPopup && <div className="overlay popup-overlay"><div className="login-popup"><div className="popup-icon">✦</div><div className="eyebrow">Cuddl update</div><h2>{loginPopup.title}</h2><p className="sub">{loginPopup.body}</p><button className="btn" onClick={()=>closeLoginPopup(loginPopup)}>Continue</button><button className="btn ghost" onClick={()=>{closeLoginPopup(loginPopup);setNotificationOpen(true)}}>View notifications</button></div></div>}
      <nav className="nav" aria-label="Primary">
        {nav.map(([id,icon,label]) => <button key={id} className={tab===id ? "active" : ""} onClick={() => {if(profileOnboarding && id!=="profile"){setProfileModal("edit");notify("Complete your profile before browsing");return;} setTab(id);}}><span>{icon}</span>{label}</button>)}
      </nav>
      {toast && <div role="status" style={{position:"fixed",left:"50%",bottom:84,transform:"translateX(-50%)",background:"#282326",color:"#fff",borderRadius:99,padding:"11px 15px",fontSize:12,zIndex:80}}>{toast}</div>}
    </div>
  );
}