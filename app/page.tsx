"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decryptChatMessage, encryptChatMessage, registerChatPublicKey } from "../lib/chat-crypto";
import { upload } from "@vercel/blob/client";

type Tab = "discover" | "lounge" | "matches" | "dates" | "bottle" | "profile";
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
  const [profileDraft, setProfileDraft] = useState<any>({displayName:"",city:"",state:"",bio:"",gender:"",desiredGender:"ANY",maritalStatus:"",personalityPrompts:[],partnerPrompts:[],profileShowcase:[],personalityStickers:[],foodPreference:"",diet:"",company:"",profession:"",religion:"",community:"",relationshipGoal:"",education:"",children:"",pets:"",smoking:"",drinking:"",exercise:"",language:"",heightCm:""});
  const chatQuickItems=["👋 Hi there!","😂 That made me smile","😍 Love this","👀 Tell me more","🤭 You’re cute","🔥 Interesting!","❤️ Same here","🎯 Challenge accepted"];
  const [profileSaving, setProfileSaving] = useState(false);
  const [aiCoachEnabled, setAiCoachEnabled] = useState(false);
  const [aiCoachBusy, setAiCoachBusy] = useState(false);
  const [aiCoachSuggestion, setAiCoachSuggestion] = useState<string[]>([]);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [matchFilters, setMatchFilters] = useState({
  company:"",profession:"",religion:"",community:"",ageMin:"18",ageMax:"60",
  gender:"",city:"",state:"",distance:"",food:"",diet:"",smoking:"",drinking:"",
  relationshipGoal:"",education:"",children:"",pets:"",exercise:"",language:"",heightMin:"",heightMax:"",verified:"",photos:""
});
  const [profileOnboarding, setProfileOnboarding] = useState(false);
  const [onboardingPromptOpen, setOnboardingPromptOpen] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>("unsupported");
  const [boostOpen, setBoostOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralData, setReferralData] = useState<any>(null);
  const [referralBusy, setReferralBusy] = useState(false);
  const [bottleOpen, setBottleOpen] = useState(false);
  const [bottleData, setBottleData] = useState<any>(null);
  const [bottleText, setBottleText] = useState("");
  const [bottleMedia, setBottleMedia] = useState<any[]>([]);
  const [bottleBusy, setBottleBusy] = useState(false);
  const [openedBottle, setOpenedBottle] = useState<any>(null);
  const [boostDuration, setBoostDuration] = useState("30");
  const [loungeFilter, setLoungeFilter] = useState("All");
  const [roomOpen, setRoomOpen] = useState<any>(null);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string,number>>({});
  const [showcaseRecording, setShowcaseRecording] = useState<"voice"|"video"|null>(null);
  const [promptRecordingTarget, setPromptRecordingTarget] = useState<{group:"personality"|"partner";index:number}|null>(null);
  const [showcaseBusy, setShowcaseBusy] = useState(false);
  const showcaseRecorderRef = useRef<MediaRecorder | null>(null);
  const showcaseStreamRef = useRef<MediaStream | null>(null);
  const showcaseChunksRef = useRef<Blob[]>([]);
  useEffect(() => { fetch("/api/me").then(r=>r.json()).then(d=>{if(d.authenticated)setUser(d);}).finally(()=>setAuthChecked(true)); }, []);
  useEffect(() => {
    if(!user) return;
    const prefs=user?.profile?.lifestylePreferences||{};
    setDesiredGender(String(prefs.desiredGender||"ANY").toUpperCase());
    const complete=!!user?.profile?.displayName && !!user?.profile?.city && !!prefs.state && !!prefs.gender && !!prefs.desiredGender && String(user?.profile?.bio||"").trim().length>=10 && !!prefs.maritalStatus;
    setProfileOnboarding(!complete);
    setOnboardingPromptOpen(!complete);
    setOnboardingChecked(true);
  }, [user]);
  useEffect(() => { if(!user) return; try { const raw=localStorage.getItem("cuddl_free_verification"); if(raw) setFreeVerificationStatus(JSON.parse(raw).status || "not_started"); } catch {} }, [user]);
  useEffect(() => { if(!user) return; setLocationGranted(!!user?.profile?.lifestylePreferences?.locationGranted); if(typeof Notification!=="undefined") setNotificationPermission(Notification.permission); }, [user]);
  useEffect(() => { if(!user) return; const ping=()=>{fetch("/api/heartbeat",{method:"POST"}).catch(()=>{});}; ping(); const timer=window.setInterval(ping, 5*60*1000); return ()=>window.clearInterval(timer); }, [user]);

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
  useEffect(() => {
    if(!aiCoachEnabled || !chatMatch?.matchId || chatMessages.length < 4 || chatMessages.length % 8 !== 0) return;
    requestAiChatCoach();
  }, [chatMessages.length, aiCoachEnabled, chatMatch?.matchId]);

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
  async function submitAuth(e: React.FormEvent) { e.preventDefault(); setAuthBusy(true); setAuthError(""); if(authMode==="register" && !passwordValid){ setAuthBusy(false); setAuthError("Password does not meet all requirements. Please complete the items shown below."); return; } const endpoint=authMode==="login"?"/api/auth/login":"/api/auth/register"; const payload=authMode==="login"?{email:authForm.email,password:authForm.password}:authForm; try { const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Authentication failed"); setUser(await fetch("/api/me").then(x=>x.json())); if(authMode==="register"){const ref=new URLSearchParams(window.location.search).get("ref"); if(ref) await fetch("/api/referral",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:ref})}).catch(()=>{}); setProfileOnboarding(true);setOnboardingPromptOpen(true);setTab("discover");} } catch(err){setAuthError(err instanceof Error?err.message:"Authentication failed");} finally{setAuthBusy(false);} }
  async function openReferral(){setReferralOpen(true);setReferralBusy(true);try{const r=await fetch("/api/referral");const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load referrals");setReferralData(d);}catch(e){notify(e instanceof Error?e.message:"Could not load referral program");}finally{setReferralBusy(false);}}
  async function loadBottle(){
    setBottleBusy(true);
    try{const r=await fetch("/api/bottle");const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load bottles");setBottleData(d);if(d.opened?.length){}}
    catch(e){notify(e instanceof Error?e.message:"Could not load bottles");}finally{setBottleBusy(false);}
  }
  async function openBottleCenter(){setBottleOpen(true);await loadBottle();}
  async function addBottleMedia(file:File,kind:"photo"|"video"){
    const max=kind==="photo"?5*1024*1024:25*1024*1024;
    if(file.size>max){notify(\`Keep \${kind} under \${kind==="photo"?"5MB":"25MB"}\`);return;}
    setBottleBusy(true);
    try{
      const blob=await upload(\`profile-media/\${user?.user?.id||user?.id}/bottle-\${kind}-\${Date.now()}-\${file.name.replace(/[^a-zA-Z0-9._-]/g,"")}\`,file,{access:"private",handleUploadUrl:"/api/profile/media/upload"});
      setBottleMedia(m=>[...m,{kind,pathname:blob.pathname}]);
    }catch(e){notify(e instanceof Error?e.message:"Could not upload bottle media");}finally{setBottleBusy(false);}
  }
  async function bottleAction(action:string,id:string){
    setBottleBusy(true);
    try{const r=await fetch("/api/bottle",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,id})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Bottle action failed");if(action==="open"||action==="connect")setOpenedBottle(d.bottle||null);await loadBottle();if(action==="connect")notify("Connection request sent.");}
    catch(e){notify(e instanceof Error?e.message:"Bottle action failed");}finally{setBottleBusy(false);}
  }
  async function throwBottle(){
    if(!bottleText.trim()&&!bottleMedia.length){notify("Add a message or media first.");return;}
    setBottleBusy(true);
    try{const r=await fetch("/api/bottle",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:bottleText,media:bottleMedia})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not throw bottle");setBottleText("");setBottleMedia([]);await loadBottle();notify("🌊 Your bottle is now drifting through Cuddl.");}
    catch(e){notify(e instanceof Error?e.message:"Could not throw bottle");}finally{setBottleBusy(false);}
  }
  async function saveDiscoveryPreference(value:string){ setDesiredGender(value); setGenderSaving(true); try { const r=await fetch("/api/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({desiredGender:value})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Could not save preference"); setUser((current:any)=>current?{...current,profile:d.profile}:current); const a=await fetch("/api/discover",{cache:"no-store"}); const ad=await a.json(); if(Array.isArray(ad.profiles)) { setDiscoverProfiles(ad.profiles); setIndex(0); setPhotoIndexes({}); } notify(value==="ANY"?"Showing all genders":"Showing "+value.toLowerCase().replace("_"," ")+" profiles"); } catch(err){ notify(err instanceof Error?err.message:"Could not save preference"); } finally { setGenderSaving(false); } }
  function openProfileEditor(){
    setOnboardingPromptOpen(false);
    const p=user?.profile||{};
    const lp=p.lifestylePreferences||{};
    setProfileDraft({displayName:String(p.displayName||""),city:String(p.city||""),state:String(lp.state||""),bio:String(p.bio||""),gender:String(lp.gender||""),desiredGender:String(lp.desiredGender||"ANY"),maritalStatus:String(lp.maritalStatus||""),personalityPrompts:Array.isArray(lp.personalityPrompts)?lp.personalityPrompts.map((x:any)=>({...x})):[],partnerPrompts:Array.isArray(lp.partnerPrompts)?lp.partnerPrompts.map((x:any)=>({...x})):[],profileShowcase:Array.isArray(lp.profileShowcase)?lp.profileShowcase:[],personalityStickers:Array.isArray(lp.personalityStickers)?lp.personalityStickers:[],foodPreference:String(lp.foodPreference||""),diet:String(lp.diet||""),company:String(lp.company||""),profession:String(lp.profession||""),religion:String(lp.religion||""),community:String(lp.community||""),relationshipGoal:String(lp.relationshipGoal||""),education:String(lp.education||""),children:String(lp.children||""),pets:String(lp.pets||""),smoking:String(lp.smoking||""),drinking:String(lp.drinking||""),exercise:String(lp.exercise||""),language:String(lp.language||""),heightCm:String(lp.heightCm||""),locationGranted:!!lp.locationGranted,locationLatitude:String(lp.locationLatitude||""),locationLongitude:String(lp.locationLongitude||""),locationAccuracy:String(lp.locationAccuracy||"")});
    setProfileModal("edit");
  }
  async function requestAiChatCoach(){
    if(aiCoachBusy || chatMessages.length<4 || !chatMatch?.matchId) return;
    setAiCoachBusy(true); setAiCoachSuggestion([]);
    try{
      const recent=chatMessages.slice(-12).map(m=>({mine:m.senderId===user?.user?.id||m.senderId===user?.id,text:String(m.body||"").slice(0,500)})).filter(m=>m.text && !m.text.startsWith("["));
      const r=await fetch("/api/ai/chat-coach",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:recent,enabled:aiCoachEnabled})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"AI coach unavailable");
      setAiCoachSuggestion(Array.isArray(d.suggestions)?d.suggestions:[]);
    }catch(err){notify(err instanceof Error?err.message:"AI coach unavailable");}
    finally{setAiCoachBusy(false);}
  }

  async function uploadPromptMedia(file:File, group:"personality"|"partner", index:number, kind:"photo"|"video"){
    if(!user?.user?.id && !user?.id)return;
    const max=kind==="photo"?5*1024*1024:25*1024*1024;
    if(file.size>max){notify(`Please keep the ${kind} under ${kind==="photo"?"5MB":"25MB"}`);return;}
    setShowcaseBusy(true);
    try{
      const ext=(file.name.split(".").pop()||"webm").toLowerCase();
      const blob=await upload(`profile-media/${user?.user?.id||user?.id}/prompt-${group}-${index}-${kind}-${Date.now()}.${ext}`,file,{
        access:"private",
        handleUploadUrl:"/api/profile/media/upload"
      });
      setProfileDraft((d:any)=>{
        const key=group==="personality"?"personalityPrompts":"partnerPrompts";
        const arr=[...(d[key]||[])];
        const item={...(arr[index]||{question:"",answer:""})};
        const media=Array.isArray(item.media)?[...item.media]:(item.media?.pathname?[item.media]:[]);
        media.push({kind,pathname:blob.pathname});
        item.media=media;
        arr[index]=item;
        return {...d,[key]:arr};
      });
      notify(kind==="photo"?"Photo attached to prompt":"Video attached to prompt");
    }catch(err){notify(err instanceof Error?err.message:"Could not upload prompt media");}
    finally{setShowcaseBusy(false);}
  }

  async function startPromptVoiceRecording(group:"personality"|"partner", index:number){
    if(promptRecordingTarget || showcaseRecording)return;
    if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined"){notify("Voice recording is not supported in this browser");return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const preferred="audio/webm;codecs=opus";
      const mime=MediaRecorder.isTypeSupported(preferred)?preferred:"audio/webm";
      const recorder=new MediaRecorder(stream,{mimeType:mime});
      const chunks:Blob[]=[];
      recorder.ondataavailable=(e)=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=async()=>{
        const blob=new Blob(chunks,{type:mime});
        try{
          setShowcaseBusy(true);
          const ext="webm";
          const blobResult=await upload(`profile-media/${user?.user?.id||user?.id}/prompt-${group}-${index}-voice-${Date.now()}.${ext}`,new File([blob],`cuddl-prompt-voice-${Date.now()}.webm`,{type:mime}),{access:"private",handleUploadUrl:"/api/profile/media/upload"});
          setProfileDraft((d:any)=>{
            const key=group==="personality"?"personalityPrompts":"partnerPrompts";
            const arr=[...(d[key]||[])];
            const item={...(arr[index]||{question:"",answer:""})};
            const media=[...(item.media||[])];
            media.push({kind:"voice",pathname:blobResult.pathname});
            item.media=media;
            arr[index]=item;
            return {...d,[key]:arr};
          });
          notify("Voice note attached to prompt");
        }catch(err){notify(err instanceof Error?err.message:"Could not upload voice note");}
        finally{setShowcaseBusy(false);}
        stream.getTracks().forEach(t=>t.stop());
      };
      recorder.start();
      showcaseRecorderRef.current=recorder;
      showcaseStreamRef.current=stream;
      setPromptRecordingTarget({group,index});
      window.setTimeout(()=>{if(showcaseRecorderRef.current?.state==="recording")stopPromptVoiceRecording();},20000);
    }catch(err){notify(err instanceof DOMException && err.name==="NotAllowedError"?"Microphone permission was denied":"Could not start voice recording");}
  }

  function stopPromptVoiceRecording(){
    const recorder=showcaseRecorderRef.current;
    if(recorder && recorder.state!=="inactive")recorder.stop();
    showcaseRecorderRef.current=null;
    showcaseStreamRef.current?.getTracks().forEach(t=>t.stop());
    showcaseStreamRef.current=null;
    setPromptRecordingTarget(null);
  }

  async function uploadProfileShowcase(file:File, kind:"photo"|"voice"|"video"){
    if(!user?.user?.id && !user?.id)return;
    const max=kind==="photo"?5*1024*1024:25*1024*1024;
    if(file.size>max){notify(`Please keep the ${kind} under ${kind==="photo"?"5MB":"25MB"}`);return;}
    setShowcaseBusy(true);
    try{
      const ext=(file.name.split(".").pop()||({photo:"jpg",voice:"webm",video:"webm"} as any)[kind]).toLowerCase();
      const blob=await upload(`profile-media/${user?.user?.id||user?.id}/${kind}-${Date.now()}.${ext}`,file,{
        access:"private",
        handleUploadUrl:"/api/profile/media/upload"
      });
      const item={kind,pathname:blob.pathname,prompt:kind==="voice"?"🎙️ My voice":"🎥 My vibe"};
      setProfileDraft((d:any)=>({...d,profileShowcase:[...(d.profileShowcase||[]).filter((x:any)=>x.kind!==kind),item]}));
      notify(kind==="photo"?"Photo added to your showcase":kind==="voice"?"Voice intro added":"Video intro added");
    }catch(err){notify(err instanceof Error?err.message:"Could not upload showcase media");}
    finally{setShowcaseBusy(false);}
  }
  function handleShowcaseFile(e:React.ChangeEvent<HTMLInputElement>,kind:"photo"|"video"){
    const file=e.target.files?.[0]; if(!file)return;
    uploadProfileShowcase(file,kind);
    e.currentTarget.value="";
  }
  async function startShowcaseRecording(kind:"voice"|"video"){
    if(showcaseRecording)return;
    if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined"){notify("Recording is not supported in this browser");return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:kind==="video"});
      showcaseStreamRef.current=stream;
      const preferred=kind==="video"?"video/webm;codecs=vp9,opus":"audio/webm;codecs=opus";
      const mime=MediaRecorder.isTypeSupported(preferred)?preferred:(kind==="video"?"video/webm":"audio/webm");
      const recorder=new MediaRecorder(stream,{mimeType:mime});
      showcaseChunksRef.current=[];
      recorder.ondataavailable=(e)=>{if(e.data.size)showcaseChunksRef.current.push(e.data);};
      recorder.onstop=async()=>{
        const blob=new Blob(showcaseChunksRef.current,{type:mime});
        const ext=kind==="video"?"webm":"webm";
        await uploadProfileShowcase(new File([blob],`cuddl-${kind}-${Date.now()}.${ext}`,{type:mime}),kind);
        stream.getTracks().forEach(t=>t.stop());
        showcaseStreamRef.current=null;
      };
      recorder.start();
      showcaseRecorderRef.current=recorder;
      setShowcaseRecording(kind);
      window.setTimeout(()=>{if(showcaseRecorderRef.current?.state==="recording")stopShowcaseRecording();},kind==="video"?15000:20000);
    }catch(err){notify(err instanceof DOMException && err.name==="NotAllowedError"?"Microphone/camera permission was denied":"Could not start recording");}
  }
  function stopShowcaseRecording(){
    const recorder=showcaseRecorderRef.current;
    if(recorder && recorder.state!=="inactive")recorder.stop();
    showcaseRecorderRef.current=null;
    setShowcaseRecording(null);
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
      const complete=!!d.profile?.displayName && !!d.profile?.city && !!lp.state && !!lp.gender && !!lp.desiredGender && String(d.profile?.bio||"").trim().length>=10 && !!lp.maritalStatus;
      setProfileOnboarding(!complete);
      setOnboardingPromptOpen(false);
      setProfileModal(complete?null:"edit");
      if(complete){setTab("discover");setPermissionsOpen(true);notify("Profile complete — finish your privacy & permission setup");} else notify("Please complete the required profile details, including marital status");
    }catch(err){notify(err instanceof Error?err.message:"Could not save profile");}
    finally{setProfileSaving(false);}
  }
  function useCurrentLocationForProfile(){
    if(!navigator.geolocation){notify("Location is not supported by this browser");return;}
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(pos=>{
      setProfileDraft((d:any)=>({...d,locationLatitude:String(pos.coords.latitude),locationLongitude:String(pos.coords.longitude),locationAccuracy:String(Math.round(pos.coords.accuracy||0)),locationGranted:true}));
      setLocationGranted(true); setLocationBusy(false); notify("Current location captured. Save profile to apply it.");
    },err=>{setLocationBusy(false);notify(err.code===1?"Location permission was denied. Enable it in browser settings.":"Could not read your current location");},{enableHighAccuracy:false,maximumAge:300000,timeout:10000});
  }
  async function requestLocation(){
    if(!navigator.geolocation){notify("Location is not supported by this browser");return;}
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const r=await fetch("/api/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({locationLatitude:pos.coords.latitude,locationLongitude:pos.coords.longitude,locationAccuracy:pos.coords.accuracy,locationGranted:true})});
        const d=await r.json(); if(!r.ok) throw new Error(d.error||"Could not save location permission");
        setUser((current:any)=>current?{...current,profile:d.profile}:current); setLocationGranted(true); notify("Location enabled for nearby discovery");
      }catch(err){notify(err instanceof Error?err.message:"Could not save location");}
      finally{setLocationBusy(false);}
    },err=>{setLocationBusy(false);notify(err.code===1?"Location permission was denied. Enable it in browser settings to use distance discovery.":"Could not read your location");},{enableHighAccuracy:false,maximumAge:300000,timeout:10000});
  }
  async function requestNotifications(){
    if(typeof Notification==="undefined"){notify("Notifications are not supported in this browser");return;}
    try{const p=await Notification.requestPermission();setNotificationPermission(p);notify(p==="granted"?"Notifications enabled":"Notifications remain off — you can enable them later");}catch{notify("Could not request notification permission");}
  }
  function openLegal(path:string){window.location.href=path;}
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
  async function sendChatContent(content:string){
    const text=content.trim();
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
  async function sendMessage(e?:React.FormEvent){
    e?.preventDefault();
    await sendChatContent(chatText);
  }

  const searchableProfiles = useMemo(() => {
    const cityCoords:any={Delhi:[28.6139,77.2090],Gurugram:[28.4595,77.0266],Noida:[28.5355,77.3910],Mumbai:[19.0760,72.8777],Bengaluru:[12.9716,77.5946],Bangalore:[12.9716,77.5946],Pune:[18.5204,73.8567],Jaipur:[26.9124,75.7873],Hyderabad:[17.3850,78.4867],Chandigarh:[30.7333,76.7794]};
    const km=(a:any,b:any)=>{if(!a||!b)return null;const R=6371,rad=(x:number)=>x*Math.PI/180;const dLat=rad(b[0]-a[0]),dLon=rad(b[1]-a[1]);const q=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));};
    const currentCity=String(user?.profile?.city||"Delhi");
    const ownLp=user?.profile?.lifestylePreferences||{};
    const origin=(Number.isFinite(Number(ownLp.locationLatitude))&&Number.isFinite(Number(ownLp.locationLongitude)))?[Number(ownLp.locationLatitude),Number(ownLp.locationLongitude)]:cityCoords[currentCity]||null;
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
        const target=(Number.isFinite(Number(lp.locationLatitude))&&Number.isFinite(Number(lp.locationLongitude)))?[Number(lp.locationLatitude),Number(lp.locationLongitude)]:cityCoords[String(p.city||"")];
        const distance=origin&&target?km(origin,target):typeof lp.distanceKm==="number"?lp.distanceKm:null;
        if(distance===null || distance>Number(matchFilters.distance)) return false;
      }
      return true;
    });
  }, [discoverProfiles,matchFilters,user]);
  const person = useMemo(() => searchableProfiles.length ? searchableProfiles[index % searchableProfiles.length] : {displayName:"",name:"",age:0,city:"",initial:"",tags:[],score:0,bio:"",lifestylePreferences:{}}, [index, searchableProfiles]);
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

  const nav = [["discover","♡","Discover"],["lounge","🎮","Lounge"],["matches","◌","Matches"],["dates","✦","Dates"],["bottle","🌊","Bottle"],["profile","☺","Profile"]] as const;

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
            <div className="profile-row profile-heading"><div className="grow"><h2 style={{margin:"4px 0"}}>{person.displayName ?? person.name}{person.age ? `, ${person.age}` : ""} ✓</h2><div className="sub">⌖ {person.city || "Location hidden"} · {person.activeNow ? <span className="active-now"><span className="active-dot"/>Active now</span> : "Recently active"}</div></div><span className="score">{person.score||88}%</span></div>
            <p className="profile-bio">{person.bio || "No bio added yet."}</p>
            {Array.isArray(person.lifestylePreferences?.personalityPrompts)&&person.lifestylePreferences.personalityPrompts.filter((x:any)=>x?.answer).slice(0,3).map((x:any,i:number)=>{
              const media=Array.isArray(x.media)?x.media:(x.media?.pathname?[x.media]:[]);
              return <div className="prompt-card prompt-package" key={"personality-"+i}>
                <small>ABOUT ME · PROMPT STORY</small><b>{x.question}</b><span>{x.answer}</span>
                {media.length>0&&<div className="prompt-package-media">{media.map((m:any,j:number)=>{
                  const src=m.pathname?"/api/profile/media?pathname="+encodeURIComponent(m.pathname):"";
                  return <div className="prompt-package-item" key={m.pathname||j}>{m.kind==="photo"?<img src={src} alt="Prompt story"/>:m.kind==="video"?<video controls playsInline preload="metadata" src={src}/>:<audio controls preload="metadata" src={src}/>}</div>
                })}</div>}
              </div>
            })}
            {Array.isArray(person.lifestylePreferences?.partnerPrompts)&&person.lifestylePreferences.partnerPrompts.filter((x:any)=>x?.answer).slice(0,3).map((x:any,i:number)=>{
              const media=Array.isArray(x.media)?x.media:(x.media?.pathname?[x.media]:[]);
              return <div className="prompt-card partner-prompt prompt-package" key={"partner-"+i}>
                <small>WHAT I VALUE IN A PARTNER · PROMPT STORY</small><b>{x.question}</b><span>{x.answer}</span>
                {media.length>0&&<div className="prompt-package-media">{media.map((m:any,j:number)=>{
                  const src=m.pathname?"/api/profile/media?pathname="+encodeURIComponent(m.pathname):"";
                  return <div className="prompt-package-item" key={m.pathname||j}>{m.kind==="photo"?<img src={src} alt="Prompt story"/>:m.kind==="video"?<video controls playsInline preload="metadata" src={src}/>:<audio controls preload="metadata" src={src}/>}</div>
                })}</div>}
              </div>
            })}
            {Array.isArray(person.lifestylePreferences?.profileShowcase)&&person.lifestylePreferences.profileShowcase.slice(0,3).map((x:any,i:number)=>{
              const src=x.pathname?`/api/profile/media?pathname=${encodeURIComponent(x.pathname)}`:"";
              return <div className="showcase-card" key={"showcase-"+i}>
                <div className="showcase-label">{x.kind==="photo"?"📸 PHOTO PROMPT":x.kind==="voice"?"🎙️ VOICE PROMPT":"🎥 VIDEO PROMPT"}</div>
                {x.kind==="photo"&&src?<img src={src} alt="Profile showcase"/>:x.kind==="voice"&&src?<audio controls preload="metadata" src={src}/>:x.kind==="video"&&src?<video controls playsInline preload="metadata" src={src}/>:null}
                {x.prompt&&<span>{x.prompt}</span>}
              </div>
            })}
            {Array.isArray(person.lifestylePreferences?.personalityStickers)&&person.lifestylePreferences.personalityStickers.length>0&&<div className="showcase-stickers">{person.lifestylePreferences.personalityStickers.slice(0,8).map((s:string)=><span className="personality-sticker" key={s}>{s}</span>)}</div>}
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
          <div className="chips">{["All","Activities","Games","Music","Social"].map(x => <button className={"chip "+(loungeFilter===x?"active":"")} key={x} onClick={()=>setLoungeFilter(x)}>{x}</button>)}</div>

          <section className="panel">
            <b>✨ Find someone who...</b><p className="sub">Pick an activity you want to share.</p>
            <div className="chips" style={{flexWrap:"wrap",overflow:"visible"}}>
              {["🎵 Sing","🥾 Trek","🍳 Cook","💃 Dance","📸 Photograph","✈️ Travel","🌱 Garden","🏙️ Explore","📚 Read","🏸 Play"].map(x => <button className="chip" key={x} onClick={() => {setLoungeFilter("Activities");setRoomOpen({type:"Interest",icon:x.slice(0,2),name:"Find someone who "+x.slice(2),meta:"Activity discovery"});}}>{x}</button>)}
            </div>
          </section>

          <div className="eyebrow" style={{marginTop:18}}>Activities</div>
          {activities.map(([icon,name,tags,count]) => <div className="room" key={name}><div className="room-top"><div className="room-icon">{icon}</div><div className="grow"><b>{name}</b><div className="room-meta">{count} · participants active</div></div><button className="join" onClick={() => notify("Joined " + name)}>Join</button></div><div className="room-meta">{tags} · camera optional · spectator mode</div></div>)}

          <div className="eyebrow" style={{marginTop:18}}>Games</div>
          {games.map(([icon,name,meta]) => <div className="room" key={name}><div className="room-top"><div className="room-icon">{icon}</div><div className="grow"><b>{name}</b><div className="room-meta">{meta}</div></div><button className="join" onClick={() => notify("Joined " + name)}>Play</button></div></div>)}

          {(loungeFilter==="All"||loungeFilter==="Music") && <><div className="eyebrow" style={{marginTop:18}}>Music</div>
          {music.map(([icon,name,meta]) => <div className="room" key={name} onClick={()=>setRoomOpen({type:"Music",icon,name,meta})}><div className="room-top"><div className="room-icon">{icon}</div><div className="grow"><b>{name}</b><div className="room-meta">{meta}</div></div><button className="join" onClick={(e)=>{e.stopPropagation();setRoomOpen({type:"Music",icon,name,meta})}}>Join</button></div><div className="room-meta">🎥 Camera optional · 🎙️ Mic optional · 🎉 Cheer = appreciation · Spark = romantic interest</div></div>)}</>}
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
            <div className="chat-tools">
          <div className="chat-tool-head"><b>Quick expressions</b><span>Tap to send</span></div>
          <div className="chips chat-quick">{chatQuickItems.map(x=><button type="button" className="chip" key={x} onClick={()=>sendChatContent(x)}>{x}</button>)}</div>
          <div className="chat-card-row">
            <button type="button" className="chat-card" onClick={()=>sendChatContent("🎲 Let’s play Would You Rather!")}>🎲 <b>Play</b><small>Would You Rather</small></button>
            <button type="button" className="chat-card" onClick={()=>sendChatContent("💬 Ask me anything — your turn!")}>💬 <b>Prompt</b><small>Ask me anything</small></button>
            <button type="button" className="chat-card" onClick={()=>sendChatContent("☕ Pick a date: coffee, walk or dinner?")}>☕ <b>Date idea</b><small>Pick one</small></button>
          </div>
          <div className="chat-tools-note">Cuddl suggestions help break the ice; you stay in control of what you send.</div>
        </div>
        <div className="ai-coach">
          <div className="chat-tool-head"><b>✦ Cuddl AI Conversation Coach</b><span>Optional</span></div>
          <label className="coach-toggle"><input type="checkbox" checked={aiCoachEnabled} onChange={e=>setAiCoachEnabled(e.target.checked)}/><span>Allow Cuddl to analyze the recent decrypted chat when I ask for suggestions.</span></label>
          {aiCoachEnabled && <><button type="button" className="btn ghost" onClick={requestAiChatCoach} disabled={aiCoachBusy||chatMessages.length<4}>{aiCoachBusy?"Thinking…":"Suggest next steps"}</button>
          {aiCoachSuggestion.length>0 && <div className="coach-suggestions">{aiCoachSuggestion.map((x:string,i:number)=><button type="button" className="chip" key={i} onClick={()=>setChatText(x)}>{x}</button>)}</div>}
          <div className="chat-tools-note">AI suggestions are optional. Cuddl never sends them automatically.</div></>}
        </div>
        <form className="chat-compose" onSubmit={sendMessage}><input className="field" value={chatText} onChange={e=>setChatText(e.target.value)} maxLength={2000} placeholder="Write a message…" /><button className="btn" disabled={chatBusy||!chatText.trim()}>{chatBusy?"…":"Send"}</button></form>
          </div>}
          <div className="panel"><b>✦ AI Wingman</b><p className="sub">Suggestions only. Cuddl never sends a message without your approval.</p><button className="btn" onClick={() => setRoomOpen({type:"AI Wingman",icon:"✦",name:"Create opener",meta:"Draft conversation starters from shared activities. Nothing is sent without your approval."})}>Create opener</button></div>
        </>}

        {tab === "dates" && <>
          <div className="eyebrow">Date Studio</div><h1 className="hero-title">Turn a connection into a memory.</h1><p className="sub">Build low-pressure plans around shared interests, budget and city.</p>
          <div className="panel"><b>✦ Chemistry Date</b><p className="sub">Café + live acoustic set · 90 min · ₹800–₹1,200 · public venue</p><button className="btn" onClick={() => setRoomOpen({type:"Date Studio",icon:"✦",name:"Chemistry Date ideas",meta:"3 low-pressure public-date concepts created from shared interests"})}>Create ideas</button></div>
          <div className="panel"><b>🛟 Date Safety</b><p className="sub">Share plan, trusted contact and arrival check-in.</p><button className="btn ghost" onClick={() => setRoomOpen({type:"Safety",icon:"🛟",name:"Date Safety Center",meta:"Share plan, trusted contact and arrival check-in"})}>Open Safety Center</button></div>
          <div className="panel"><b>💌 Date Capsule</b><p className="sub">Both answer one question. Answers unlock together after the date.</p><button className="btn ghost" onClick={() => setRoomOpen({type:"Date Capsule",icon:"💌",name:"Date Capsule",meta:"Create a question for both people to answer"})}>Create capsule</button></div>
        </>}

        {tab === "bottle" && <>
          <div className="eyebrow">Exclusive Pro & Premium</div>
          <h1 className="hero-title">🌊 Message in a Bottle</h1>
          <p className="sub">Send a little piece of yourself into the Cuddl ocean. Someone unexpected may discover it.</p>
          <div className="panel bottle-hero">
            <div className="bottle-ocean">🌊 🫧 🐚 🫧 🌊</div>
            <div><b>{bottleData?.plan==="PREMIUM"?"Premium":"Pro"} bottle allowance</b><p className="sub">{bottleData?.plan==="PREMIUM"?"5":"2"} bottles per month · one active bottle at a time</p></div>
          </div>
          {bottleBusy&&<p className="safe">Updating bottle…</p>}
          {bottleData?.incoming&&<div className="panel bottle-incoming"><div className="eyebrow">You found a bottle</div><h2>🧴 Someone left you a message</h2><p className="sub">Open it to discover what they chose to share. Their identity stays hidden until you choose to connect.</p><button className="btn" disabled={bottleBusy} onClick={()=>bottleAction("open",bottleData.incoming.id)}>Open bottle</button></div>}
          {openedBottle&&<div className="panel bottle-opened"><div className="eyebrow">Bottle opened</div><h2>✨ A little mystery revealed</h2><p className="bottle-text">{openedBottle.text}</p>{Array.isArray(openedBottle.media)&&<div className="bottle-media-grid">{openedBottle.media.map((m:any,i:number)=>{const src="/api/profile/media?pathname="+encodeURIComponent(m.pathname);return <div key={m.pathname||i}>{m.kind==="photo"?<img src={src} alt="Bottle"/>:m.kind==="video"?<video controls playsInline src={src}/>:<audio controls src={src}/>}</div>})}</div>}<div className="actions"><button className="btn" disabled={bottleBusy} onClick={()=>bottleAction("connect",openedBottle.id)}>💗 Connect</button><button className="btn ghost" disabled={bottleBusy} onClick={()=>bottleAction("pass",openedBottle.id)}>Pass</button><button className="btn ghost" disabled={bottleBusy} onClick={()=>bottleAction("report",openedBottle.id)}>Report</button></div></div>}
          {!openedBottle&&!bottleData?.incoming&&<div className="panel"><div className="eyebrow">Create your bottle</div><h2>What would you send into the unknown?</h2><textarea className="field profile-textarea" maxLength={700} placeholder="Write something genuine, playful or curious…" value={bottleText} onChange={e=>setBottleText(e.target.value)}/>
            <div className="bottle-upload-row"><label className="prompt-media-btn">📸 Photo<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)addBottleMedia(f,"photo");e.currentTarget.value=""}}/></label><label className="prompt-media-btn">🎥 Video<input type="file" accept="video/*" onChange={e=>{const f=e.target.files?.[0];if(f)addBottleMedia(f,"video");e.currentTarget.value=""}}/></label><button className="prompt-media-btn" onClick={async()=>{if(!navigator.mediaDevices?.getUserMedia){notify("Voice recording is not supported");return;}try{const s=await navigator.mediaDevices.getUserMedia({audio:true});const rec=new MediaRecorder(s);const chunks:Blob[]=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);rec.onstop=async()=>{s.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:rec.mimeType||"audio/webm"});const file=new File([blob],"bottle-voice.webm",{type:blob.type});const b=await upload(\`profile-media/\${user?.user?.id||user?.id}/bottle-voice-\${Date.now()}.webm\`,file,{access:"private",handleUploadUrl:"/api/profile/media/upload"});setBottleMedia(m=>[...m,{kind:"voice",pathname:b.pathname}]);};rec.start();setTimeout(()=>rec.state==="recording"&&rec.stop(),20000);notify("Recording voice note…");}catch{notify("Microphone permission was not granted")}}}>🎙️ Voice</button></div>
            {bottleMedia.length>0&&<div className="bottle-media-list">{bottleMedia.map((m,i)=><div key={m.pathname||i}>{m.kind==="photo"?"📸 Photo":m.kind==="video"?"🎥 Video":"🎙️ Voice note"} <button className="chip" onClick={()=>setBottleMedia(x=>x.filter((_,j)=>j!==i))}>Remove</button></div>)}</div>}
            <button className="btn" disabled={bottleBusy} onClick={throwBottle}>🌊 Throw bottle into the ocean</button>
          </div>}
          {bottleData?.active&&<div className="panel"><b>🌊 Your bottle is drifting</b><p className="sub">You can throw another bottle only after this one has been opened. Monthly usage: {bottleData.usedThisMonth}/{bottleData.plan==="PREMIUM"?5:2}.</p></div>}
          {bottleData?.plan==="BASIC"&&<div className="panel"><b>🔒 Pro & Premium feature</b><p className="sub">Message in a Bottle is reserved for Pro and Premium members. Upgrade when billing is available.</p><button className="btn ghost" onClick={()=>openLegal("/plans")}>View plans</button></div>}
        </>}

        {tab === "profile" && <>
          <div className="eyebrow">Your space · {city}</div><h1 className="hero-title">Profile, privacy & trust.</h1>
          <div className="panel"><div className="profile-row"><div className="avatar">S</div><div><b>Your profile</b><div className="sub">82% complete · Add voice intro</div></div></div>{Array.isArray(user?.profile?.lifestylePreferences?.personalityPrompts)&&user.profile.lifestylePreferences.personalityPrompts.some((x:any)=>x?.answer)&&<div className="panel"><b>✨ Your personality story</b><p className="sub">Your selected prompts are visible on your profile.</p></div>}<div className="actions"><button className="btn" onClick={()=>setBoostOpen(true)}>🚀 Boost profile</button><button className="btn" onClick={openProfileEditor}>Edit profile</button><button className="btn ghost" onClick={() => setMediaOpen(true)}>Photos & videos</button><button className="btn ghost" onClick={() => setVerificationOpen(true)}>{freeVerificationStatus==="verified"?"✓ Identity verified":freeVerificationStatus==="pending"?"Verification pending":"Verify identity"}</button><button className="btn ghost" onClick={logout}>Sign out</button></div></div>
          <div className="panel"><div className="eyebrow">Rewards</div><h3>🎁 Refer & earn</h3><p className="safe">Invite friends to Cuddl. When the referral meets the admin-defined qualifying condition, your reward is credited to your account.</p><div className="actions"><button className="btn" onClick={openReferral}>Open referral & rewards</button></div></div>
          <div className="panel"><b>Privacy, permissions & legal</b><p className="safe">Location for discovery, contextual camera/microphone access, notifications, privacy controls and the policies that govern Cuddl.</p><div className="actions"><button className="btn ghost" onClick={() => setPermissionsOpen(true)}>Permissions</button><button className="btn ghost" onClick={() => setProfileModal("privacy")}>Manage privacy</button><button className="btn ghost" onClick={() => openLegal("/plans")}>Plans & Premium</button></div><div className="actions"><button className="btn ghost" onClick={() => openLegal("/privacy")}>Privacy Policy</button><button className="btn ghost" onClick={() => openLegal("/terms")}>Terms</button><button className="btn ghost" onClick={() => openLegal("/disclaimer")}>Disclaimer</button><button className="btn ghost" onClick={() => openLegal("/legal-resolution")}>Legal resolution</button></div></div>
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

      {referralOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Referral & rewards</div><h2>🎁 Invite. Qualify. Earn.</h2>
        {referralBusy?<p className="sub">Loading your referral program…</p>:<>
          <p className="sub">Your unique referral code can be shared with friends. Rewards are controlled by Cuddl admin and are credited only after the qualifying condition is met.</p>
          <div className="panel"><small>Your referral code</small><h2>{referralData?.code||"—"}</h2><p className="safe">{referralData?.referralLink||""}</p><div className="actions"><button className="btn" onClick={()=>{if(referralData?.referralLink)navigator.clipboard?.writeText("Join me on Cuddl: "+location.origin+referralData.referralLink).then(()=>notify("Referral link copied"));}}>Copy link</button><button className="btn ghost" onClick={()=>{if(referralData?.referralLink&&navigator.share)navigator.share({title:"Join me on Cuddl",url:location.origin+referralData.referralLink}).catch(()=>{})}}>Share</button></div></div>
          <div className="verification-list"><div><b>Reward:</b> {referralData?.settings?.reward_type||"Admin defined"}</div><div><b>Qualification:</b> {referralData?.settings?.qualification_event||"Admin defined"}</div><div><b>Your referrals:</b> {(referralData?.stats||[]).reduce((n:any,x:any)=>n+Number(x.count||0),0)}</div></div>
          {Array.isArray(referralData?.rewards)&&referralData.rewards.length>0&&<div className="verification-list">{referralData.rewards.slice(0,5).map((x:any,i:number)=><div key={i}>✓ {x.reward_type} · {JSON.stringify(x.reward_value)}</div>)}</div>}
        </>}
        <button className="btn ghost" onClick={()=>setReferralOpen(false)}>Close</button>
      </div></div>}
      {boostOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Premium visibility</div><h2>🚀 Boost your profile</h2>
        <p className="sub">Boost moves your profile into more eligible discovery impressions for a limited period. It does not guarantee a Spark, match or reply.</p>
        <div className="verification-list"><div><b>30 minutes</b> · standard Boost</div><div><b>60 minutes</b> · extended Boost</div><div><b>180 minutes</b> · extended visibility</div></div>
        <select className="field" value={boostDuration} onChange={e=>setBoostDuration(e.target.value)}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="180">180 minutes</option></select>
        <button className="btn" onClick={()=>{setBoostOpen(false);notify("Boost activated for "+boostDuration+" minutes 🚀")}}>Activate Boost</button>
        <button className="btn ghost" onClick={()=>setBoostOpen(false)}>Close</button>
      </div></div>}
      {roomOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="popup-icon">{roomOpen.icon}</div><div className="eyebrow">{roomOpen.type}</div><h2>{roomOpen.name}</h2>
        <p className="sub">{roomOpen.meta || "Live room"} · Meet people through shared participation rather than profile swiping.</p>
        <div className="verification-list"><div>🎥 Camera optional</div><div>🎙️ Microphone optional</div><div>💗 Spark remains the romantic-interest action</div><div>🛡️ Report / block controls remain available</div></div>
        <button className="btn" onClick={()=>{setRoomOpen(null);notify("You entered "+roomOpen.name+" ✦")}}>Enter now</button>
        <button className="btn ghost" onClick={()=>setRoomOpen(null)}>Close</button>
      </div></div>}
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
      {profileModal==="edit" && <div className="profile-editor-page"><div className="profile-editor-inner">
        <div className="profile-editor-header"><div><div className="eyebrow">Edit profile</div><h2>Make your profile yours.</h2><p className="sub">Build a profile that feels like you. Add context, prompts and media without the popup experience.</p></div><button className="icon-btn" onClick={()=>{setProfileModal(null);if(profileOnboarding)setOnboardingPromptOpen(true);}} aria-label="Close profile editor">×</button></div>
        <div className="auth-form">
          <input className="field" placeholder="Profile name" value={profileDraft.displayName} onChange={e=>setProfileDraft({...profileDraft,displayName:e.target.value})}/>
          <input className="field" placeholder="City" value={profileDraft.city} onChange={e=>setProfileDraft({...profileDraft,city:e.target.value})} required />
          <textarea className="field profile-textarea" placeholder="Short bio (tell people something real about you)" value={profileDraft.bio} onChange={e=>setProfileDraft({...profileDraft,bio:e.target.value})} minLength={10} required />
          <div className="profile-location-card"><div><div className="eyebrow">Discovery location</div><b>📍 Current location</b><p className="safe">Used for nearby-distance matching. Your exact coordinates are never shown to other members.</p></div><button type="button" className="btn ghost" onClick={useCurrentLocationForProfile} disabled={locationBusy}>{profileDraft.locationGranted?"Update current location":"Use current location"}</button>{profileDraft.locationGranted&&<span className="location-status">✓ Location captured — save profile to apply</span>}</div><div className="profile-extended-grid"><input className="field" placeholder="State" value={profileDraft.state||""} onChange={e=>setProfileDraft({...profileDraft,state:e.target.value})}/><input className="field" placeholder="Food preference" value={profileDraft.foodPreference||""} onChange={e=>setProfileDraft({...profileDraft,foodPreference:e.target.value})}/><input className="field" placeholder="Company" value={profileDraft.company||""} onChange={e=>setProfileDraft({...profileDraft,company:e.target.value})}/><input className="field" placeholder="Profession" value={profileDraft.profession||""} onChange={e=>setProfileDraft({...profileDraft,profession:e.target.value})}/><input className="field" placeholder="Religion" value={profileDraft.religion||""} onChange={e=>setProfileDraft({...profileDraft,religion:e.target.value})}/><input className="field" placeholder="Community" value={profileDraft.community||""} onChange={e=>setProfileDraft({...profileDraft,community:e.target.value})}/><select className="field" value={profileDraft.diet||""} onChange={e=>setProfileDraft({...profileDraft,diet:e.target.value})}><option value="">Diet</option><option>Vegetarian</option><option>Vegan</option><option>Eggetarian</option><option>Jain</option><option>Non-vegetarian</option><option>Anything</option></select><select className="field" value={profileDraft.smoking||""} onChange={e=>setProfileDraft({...profileDraft,smoking:e.target.value})}><option value="">Smoking</option><option>Never</option><option>Occasionally</option><option>Regularly</option><option>Prefer not to say</option></select><select className="field" value={profileDraft.drinking||""} onChange={e=>setProfileDraft({...profileDraft,drinking:e.target.value})}><option value="">Drinking</option><option>Never</option><option>Occasionally</option><option>Socially</option><option>Regularly</option><option>Prefer not to say</option></select><input className="field" placeholder="Relationship goal" value={profileDraft.relationshipGoal||""} onChange={e=>setProfileDraft({...profileDraft,relationshipGoal:e.target.value})}/><input className="field" placeholder="Education" value={profileDraft.education||""} onChange={e=>setProfileDraft({...profileDraft,education:e.target.value})}/><input className="field" placeholder="Children preference" value={profileDraft.children||""} onChange={e=>setProfileDraft({...profileDraft,children:e.target.value})}/><input className="field" placeholder="Pets preference" value={profileDraft.pets||""} onChange={e=>setProfileDraft({...profileDraft,pets:e.target.value})}/><select className="field" value={profileDraft.exercise||""} onChange={e=>setProfileDraft({...profileDraft,exercise:e.target.value})}><option value="">Exercise</option><option>Daily</option><option>Often</option><option>Sometimes</option><option>Rarely</option></select><input className="field" placeholder="Language(s)" value={profileDraft.language||""} onChange={e=>setProfileDraft({...profileDraft,language:e.target.value})}/><input className="field" inputMode="numeric" placeholder="Height (cm)" value={profileDraft.heightCm||""} onChange={e=>setProfileDraft({...profileDraft,heightCm:e.target.value.replace(/\D/g,"")})}/></div><div className="profile-row"><select className="field" value={profileDraft.gender} onChange={e=>setProfileDraft({...profileDraft,gender:e.target.value})}><option value="">Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option></select><select className="field" value={profileDraft.desiredGender} onChange={e=>setProfileDraft({...profileDraft,desiredGender:e.target.value})}><option value="FEMALE">Women</option><option value="MALE">Men</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option><option value="ANY">Everyone</option></select></div>
          <div className="filter-section-title">✨ Show your personality</div>
          <p className="safe">Choose up to 3. Build each one as a complete Prompt Story: a short caption plus any combination of photo, video and voice explanation. Use one or use all — your choice.</p>
          {[0,1,2].map((i:number)=>{
            const item=profileDraft.personalityPrompts?.[i]||{question:"",answer:""};
            const media=item.media;
            const setItem=(patch:any)=>{
              const a=[...(profileDraft.personalityPrompts||[])];
              a[i]={...(a[i]||{question:"",answer:""}),...patch};
              setProfileDraft({...profileDraft,personalityPrompts:a});
            };
            return <div className="prompt-editor prompt-editor-rich" key={"pp-"+i}>
              <select className="field" value={item.question} onChange={e=>setItem({question:e.target.value})}>
                <option value="">Personality prompt {i+1}</option>
                <option>I'm happiest when…</option><option>In my friend group, I'm the one who…</option><option>I could talk all night about…</option><option>A perfect Sunday for me is…</option><option>Something people notice about me…</option><option>My most spontaneous decision was…</option><option>My underrated talent is…</option><option>You'll never guess that I…</option>
              </select>
              <textarea className="field profile-textarea" maxLength={220} placeholder="Your answer…" value={item.answer||""} onChange={e=>setItem({answer:e.target.value})} />
              <div className="prompt-media-tools">
                <label className="prompt-media-btn">📸 Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)uploadPromptMedia(file,"personality",i,"photo");e.currentTarget.value=""}} /></label>
                <label className="prompt-media-btn">🎥 Video<input type="file" accept="video/*" onChange={e=>{const file=e.target.files?.[0];if(file)uploadPromptMedia(file,"personality",i,"video");e.currentTarget.value=""}} /></label>
                <button type="button" className={"prompt-media-btn "+(promptRecordingTarget?.group==="personality"&&promptRecordingTarget.index===i?"recording":"")} onClick={()=>promptRecordingTarget?.group==="personality"&&promptRecordingTarget.index===i?stopPromptVoiceRecording():startPromptVoiceRecording("personality",i)} disabled={showcaseBusy}>{promptRecordingTarget?.group==="personality"&&promptRecordingTarget.index===i?"⏹ Stop":"🎙️ Voice"}</button>
              </div>
              {Array.isArray(media)&&media.length>0&&<div className="prompt-media-added-list">{media.map((m:any,j:number)=><div className="prompt-media-added" key={m.pathname||j}><span>{m.kind==="photo"?"📸 Photo":m.kind==="video"?"🎥 Video":"🎙️ Voice note"}</span><button type="button" className="chip" onClick={()=>setItem({media:media.filter((_:any,k:number)=>k!==j)})}>Remove</button></div>)}</div>}
            </div>
          })}
          <div className="filter-section-title">🎨 Profile-wide Personality Showcase</div>
          <p className="safe">Optional media that represents your overall vibe. Prompt media above stays attached to its specific answer.</p>
          <div className="showcase-upload-grid">
            <label className="showcase-upload"><span>📸</span><b>Add profile photo</b><small>Show a moment that feels like you</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>handleShowcaseFile(e,"photo")} /></label>
            <button type="button" className="showcase-upload" onClick={()=>showcaseRecording==="voice"?stopShowcaseRecording():startShowcaseRecording("voice")} disabled={showcaseBusy}><span>🎙️</span><b>{showcaseRecording==="voice"?"Stop voice":"Record voice"}</b><small>Up to 20 seconds</small></button>
            <button type="button" className="showcase-upload" onClick={()=>showcaseRecording==="video"?stopShowcaseRecording():startShowcaseRecording("video")} disabled={showcaseBusy}><span>🎥</span><b>{showcaseRecording==="video"?"Stop video":"Record video"}</b><small>Up to 15 seconds</small></button>
          </div>
          {Array.isArray(profileDraft.profileShowcase)&&profileDraft.profileShowcase.length>0&&<div className="showcase-preview-list">
            {profileDraft.profileShowcase.map((x:any,i:number)=><div className="showcase-preview" key={x.pathname||i}><b>{x.kind==="photo"?"📸 Photo":x.kind==="voice"?"🎙️ Voice intro":"🎥 Video intro"}</b><span>{x.pathname?"Added to your profile":"Not uploaded"}</span><button type="button" className="chip" onClick={()=>setProfileDraft((d:any)=>({...d,profileShowcase:(d.profileShowcase||[]).filter((_:any,j:number)=>j!==i)}))}>Remove</button></div>)}
          </div>}
          <div className="showcase-sticker-picker">
            <b>🧩 Pick your personality stickers</b><span className="safe">Choose up to 8. These are visual hints, not labels.</span>
            <div className="chips">
              {["☕ Coffee Person","🎵 Music Lover","✈️ Traveller","🍜 Foodie","🐶 Dog Lover","📚 Bookworm","🏃 Fitness","🎨 Creative","🌿 Nature","🎮 Gamer","😂 Funny","🌙 Night Owl"].map(s=>{
                const selected=(profileDraft.personalityStickers||[]).includes(s);
                return <button type="button" className={"chip "+(selected?"active":"")} key={s} onClick={()=>setProfileDraft((d:any)=>({...d,personalityStickers:selected?(d.personalityStickers||[]).filter((x:string)=>x!==s):[...(d.personalityStickers||[]),s].slice(0,8)}))}>{s}</button>
              })}
            </div>
          </div>
          <div className="filter-section-title">❤️ What I value in a partner</div>
          <p className="safe">Build a complete Partner Story if you want: short text plus any combination of photo, video and voice. These help people understand the person behind the preference.</p>
          {[0,1,2].map((i:number)=>{
            const item=profileDraft.partnerPrompts?.[i]||{question:"",answer:""};
            const media=item.media;
            const setItem=(patch:any)=>{
              const a=[...(profileDraft.partnerPrompts||[])];
              a[i]={...(a[i]||{question:"",answer:""}),...patch};
              setProfileDraft({...profileDraft,partnerPrompts:a});
            };
            return <div className="prompt-editor prompt-editor-rich" key={"vp-"+i}>
              <select className="field" value={item.question} onChange={e=>setItem({question:e.target.value})}>
                <option value="">Partner preference {i+1}</option>
                <option>I'm looking for someone who…</option><option>A relationship works best for me when…</option><option>One thing that matters to me long-term…</option><option>My ideal way to spend a free day together…</option><option>Communication matters to me because…</option><option>When there's a disagreement, I prefer…</option><option>Family and relationships…</option><option>I'd love a partner who is curious about…</option>
              </select>
              <textarea className="field profile-textarea" maxLength={220} placeholder="Your answer…" value={item.answer||""} onChange={e=>setItem({answer:e.target.value})} />
              <div className="prompt-media-tools">
                <label className="prompt-media-btn">📸 Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)uploadPromptMedia(file,"partner",i,"photo");e.currentTarget.value=""}} /></label>
                <label className="prompt-media-btn">🎥 Video<input type="file" accept="video/*" onChange={e=>{const file=e.target.files?.[0];if(file)uploadPromptMedia(file,"partner",i,"video");e.currentTarget.value=""}} /></label>
                <button type="button" className={"prompt-media-btn "+(promptRecordingTarget?.group==="partner"&&promptRecordingTarget.index===i?"recording":"")} onClick={()=>promptRecordingTarget?.group==="partner"&&promptRecordingTarget.index===i?stopPromptVoiceRecording():startPromptVoiceRecording("partner",i)} disabled={showcaseBusy}>{promptRecordingTarget?.group==="partner"&&promptRecordingTarget.index===i?"⏹ Stop":"🎙️ Voice"}</button>
              </div>
              {Array.isArray(media)&&media.length>0&&<div className="prompt-media-added-list">{media.map((m:any,j:number)=><div className="prompt-media-added" key={m.pathname||j}><span>{m.kind==="photo"?"📸 Photo":m.kind==="video"?"🎥 Video":"🎙️ Voice note"}</span><button type="button" className="chip" onClick={()=>setItem({media:media.filter((_:any,k:number)=>k!==j)})}>Remove</button></div>)}</div>}
            </div>
          })}
        </div>
        <button className="btn" onClick={saveProfile} disabled={profileSaving}>{profileSaving?"Saving…":"Save changes"}</button>
        <button className="btn ghost" onClick={()=>{setProfileModal(null);if(profileOnboarding)setOnboardingPromptOpen(true);}}>Close</button>
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
      {permissionsOpen && <div className="overlay popup-overlay onboarding-lock"><div className="login-popup profile-modal">
        <div className="eyebrow">Privacy & permissions setup</div><h2>One last setup before you discover.</h2>
        <p className="sub">Cuddl asks only for permissions used by a feature. Location is required for distance-based discovery. Camera and microphone are requested when you use verification or voice features. Notifications are optional.</p>
        <div className="permission-card"><div><b>📍 Location · Required for discovery</b><span>{locationGranted?"Enabled":"Use approximate/foreground location for distance discovery; precise location is not shown to other members."}</span></div><button className="btn" onClick={requestLocation} disabled={locationBusy||locationGranted}>{locationGranted?"Enabled ✓":locationBusy?"Requesting…":"Enable"}</button></div>
        <div className="permission-card"><div><b>🔔 Notifications · Recommended</b><span>{notificationPermission==="granted"?"Enabled":"Match, message and safety updates. You can change this anytime."}</span></div><button className="btn ghost" onClick={requestNotifications} disabled={notificationPermission==="granted"||notificationPermission==="denied"}>{notificationPermission==="granted"?"Enabled ✓":notificationPermission==="denied"?"Blocked":"Enable"}</button></div>
        <div className="permission-card"><div><b>🖼️ Photos & videos · Device media</b><span>Used only when you choose media for your profile or a Prompt Story. Cuddl cannot browse your gallery in the background. Your browser/device shows the file or media picker when you select an item.</span></div><button className="btn ghost" onClick={()=>{setPermissionsOpen(false);setProfileModal("edit");}}>Add media</button></div>
        <div className="permission-card"><div><b>📷 Camera & 🎙️ microphone · Contextual</b><span>Camera is requested when you capture verification/profile video. Microphone is requested when you record a voice note or video with audio.</span></div><button className="btn ghost" onClick={async()=>{try{const s=await navigator.mediaDevices?.getUserMedia({audio:true,video:true});s?.getTracks().forEach(t=>t.stop());notify("Camera & microphone permission checked");}catch(e){notify("Camera/microphone permission was not granted")}}}>Test camera & mic</button></div>
        <div className="safe">We do not request broad contacts access or background location just for convenience. You can manage permissions from your device/browser settings.</div>
        <button className="btn" disabled={!locationGranted} onClick={()=>setPermissionsOpen(false)}>{locationGranted?"Continue to Cuddl":"Enable location to continue"}</button>
        <button className="btn ghost" onClick={()=>setPermissionsOpen(false)}>Close</button>
      </div></div>}
      {profileOnboarding && onboardingChecked && onboardingPromptOpen && <div className="overlay popup-overlay onboarding-lock"><div className="login-popup profile-modal">
        <div className="eyebrow">Required before Discover</div><h2>Complete your profile first.</h2>
        <p className="sub">Cuddl will take you to profile search only after these basic details are completed. This prevents browsing other members with an unfinished profile.</p>
        <div className="verification-list"><div>✓ Profile name</div><div>✓ City & state</div><div>✓ Gender & discovery preference</div><div>✓ Short bio (minimum 10 characters)</div></div>
        <button className="btn" onClick={openProfileEditor}>Update my profile</button>
      </div></div>}
      {festivalOpen && festival && <div className="overlay"><div className="festival-sheet">
        <div className="sheet-head"><div><div className="eyebrow">Special occasion · Live now</div><h2>{festival.festival.coverEmoji} {festival.festival.name}</h2><p className="sub">{festival.festival.description || "Move freely from one activity to another. This festival hub disappears when the admin switches it off."}</p></div><button className="icon-btn" onClick={()=>setFestivalOpen(false)}>×</button></div>
        <div className="festival-roam">{festival.locked?<div className="panel"><div className="popup-icon">✨</div><b>Festival activities are a paid-plan experience</b><p className="sub">This festival is live, but the activity rooms are reserved for Plus, Pro and Premium members. Basic users still receive the festival announcement and can upgrade when they choose.</p><button className="btn" onClick={()=>openLegal("/plans")}>View plans</button></div>:festival.activities.map((a:any)=><div className="festival-card" key={a.id}><div className="room-icon">✨</div><div className="grow"><b>{a.name}</b><div className="room-meta">{a.category}{a.city?" · "+a.city:""}{a.capacity?" · "+a.capacity+" spots":""}</div><div className="sub">{a.description || "Join, explore and meet people through this festival activity."}</div></div><button className="join" onClick={()=>notify("Entered "+a.name)}>Enter</button></div>)}</div>
        <div className="panel"><b>Roam freely</b><p className="sub">No permanent festival tab is kept in your account. When the event ends, this special hub disappears automatically.</p></div>
      </div></div>}
      {notificationOpen && <div className="overlay"><div className="notification-sheet">
        <div className="sheet-head"><div><div className="eyebrow">Cuddl notifications</div><h2>Updates for you</h2></div><button className="icon-btn" onClick={()=>setNotificationOpen(false)}>×</button></div>
        {notifications.length===0?<div className="panel"><p className="sub">No notifications yet.</p></div>:notifications.map(n=><button className={"notification-item "+(n.read?"read":"")} key={n.id} onClick={()=>openNotification(n)}><div><b>{n.title}</b><p>{n.body}</p><small>{n.read?"Read":"New"} · {new Date(n.publishedAt).toLocaleString()}</small></div>{!n.read&&<span>●</span>}</button>)}
      </div></div>}
      {loginPopup && <div className="overlay popup-overlay"><div className="login-popup"><div className="popup-icon">✦</div><div className="eyebrow">Cuddl update</div><h2>{loginPopup.title}</h2><p className="sub">{loginPopup.body}</p><button className="btn" onClick={()=>closeLoginPopup(loginPopup)}>Continue</button><button className="btn ghost" onClick={()=>{closeLoginPopup(loginPopup);setNotificationOpen(true)}}>View notifications</button></div></div>}
      <nav className="nav" aria-label="Primary">
        {nav.map(([id,icon,label]) => <button key={id} className={tab===id ? "active" : ""} onClick={() => {if(profileOnboarding && id!=="profile" && id!=="bottle"){setProfileModal("edit");notify("Complete your profile before browsing");return;} setTab(id);}}><span>{icon}</span>{label}</button>)}
      </nav>
      {toast && <div role="status" style={{position:"fixed",left:"50%",bottom:84,transform:"translateX(-50%)",background:"#282326",color:"#fff",borderRadius:99,padding:"11px 15px",fontSize:12,zIndex:80}}>{toast}</div>}
    </div>
  );
}