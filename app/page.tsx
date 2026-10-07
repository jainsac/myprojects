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
  ["☕", "20-Minute Coffee Date", "Conversation · Dating", "10/12"],
  ["🎤", "Karaoke Pair Challenge", "Music · Fun", "8/12"],
  ["🧠", "Deep Talk Circle", "Questions · Connection", "9/15"],
  ["😂", "Meme & Laugh Exchange", "Humour · Social", "13/20"],
  ["🌇", "Sunset Story Swap", "Stories · Lifestyle", "6/10"],
  ["🎨", "Draw My Vibe", "Art · Personality", "7/10"],
  ["💚", "Green Flag Lab", "Compatibility · Dating", "11/16"],
  ["✈️", "Travel Stories & Dream Trips", "Travel · Adventure", "18/25"],
  ["🎨", "Sketch Together", "Art · Creativity", "6/10"],
  ["☕", "Virtual Coffee Date", "Pro · Virtual date", "Open"],
  ["🍽️", "Virtual Dinner Date", "Pro · Virtual date", "Open"],
  ["🎬", "Virtual Movie Date", "Pro · Virtual date", "Open"],
  ["💬", "Communication Compatibility Session", "Pro · Compatibility", "Open"],
  ["🗓️", "Cuddl Date Planner", "Premium · Date planning", "Open"],
  ["✈️", "Travel Stories & Dream Trips", "Plus+ · Travel", "18/25"],
  ["🎙️", "Premium Host Room", "Premium · Host & spectate", "Open"],
];

const games = [
  ["🎲", "Rapid Fire + Truth & Dare", "8/12 · 4 active"],
  ["♟️", "Chess Café", "6/8 · 2 playing"],
  ["🎯", "Ludo After Work", "12/16 · 6 active"],
  ["⭕", "Tic-Tac-Toe", "Quick 1-on-1"],
  ["🐍", "Snake Sprint", "Beat the room score"],
  ["🧠", "Rapid Quiz", "5 quick questions"],
  ["🧩", "Memory Match", "Find pairs together"],
  ["🎭", "Emoji Guess", "Guess the story"],
  ["💚", "Green Flag / Red Flag", "Fast compatibility"],
  ["💬", "Would You Rather", "Quick choices"],
  ["🎲", "Two Truths & a Lie", "Guess the lie"],
  ["⚡", "5 Second Challenge", "Answer before time"],
  ["🎵", "Guess the Song", "Music challenge"],
  ["🎬", "Guess the Movie", "Emoji movie quiz"],
  ["🧠", "Couple Trivia Battle", "Pro duel · compatibility"],
  ["💚", "Compatibility Clash", "Pro compatibility duel"],
  ["⚡", "Beat the Clock", "Pro timed challenge"],
  ["🔤", "Word Chain Battle", "Pro word duel"],
  ["🧩", "Picture Puzzle Duel", "Pro visual duel"],
  ["🎯", "Guess My Answer", "Pro prediction game"],
  ["📖", "Story Builder", "Pro co-created story"],
  ["🎵", "Song Battle", "Pro music duel"],
  ["🎬", "Movie Emoji Battle", "Pro movie duel"],
  ["🧠", "Memory About Me", "Pro remember-your-match"],
  ["⚡", "Fast Questions Duel", "Pro rapid connection"],
  ["🗺️", "Cuddl Quest", "Premium adventure"],
  ["🔐", "Two-Person Escape Room", "Premium puzzle room"],
  ["🕵️", "Mystery Match", "Premium mystery experience"],
  ["💞", "Love Language Challenge", "Premium compatibility"],
  ["🔮", "Future Together", "Premium future planning"],
  ["🏡", "Dream Life Builder", "Premium shared vision"],
  ["♟️", "Couple Strategy Game", "Premium strategy"],
  ["🏆", "Cuddl Championship", "Premium tournament"],
];

const music = [
  ["🎤", "Bollywood Karaoke", "14/20 · 5 on stage"],
  ["🎶", "Acoustic Open Mic", "9/15 · 2 singing"],
  ["🎧", "Listen Together — Indie", "18/30 · listening"],
];

const LUDO_TRACK = (() => {
  const a:[number,number][]=[];
  const n=15, min=140, max=460, step=(max-min)/(n-1);
  for(let i=1;i<n-1;i++) a.push([min+i*step,min]);
  for(let i=1;i<n-1;i++) a.push([max,min+i*step]);
  for(let i=n-2;i>0;i--) a.push([min+i*step,max]);
  for(let i=n-2;i>0;i--) a.push([min,max-i*step]);
  return a;
})();
const LUDO_COLORS=["#e95d72","#5b82d8","#55a67a","#a57ad8"];

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
  const [planConfig, setPlanConfig] = useState<any>(null);
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
  const [freeVerificationStatus, setFreeVerificationStatus] = useState<"not_started"|"ai_pending"|"ai_verified"|"reverify_required"|"verified">("not_started");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraAngle, setCameraAngle] = useState<"front"|"left"|"right">("front");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [verificationResponse,setVerificationResponse]=useState("");
  const [verificationResponseBusy,setVerificationResponseBusy]=useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [profileModal, setProfileModal] = useState<null | "edit" | "privacy" | "feature">(null);
  const [activeFeature, setActiveFeature] = useState({title:"",copy:""});
  const [profileDraft, setProfileDraft] = useState<any>({displayName:"",city:"",state:"",bio:"",gender:"",desiredGender:"ANY",maritalStatus:"",personalityPrompts:[],partnerPrompts:[],profileShowcase:[],personalityStickers:[],foodPreference:"",diet:"",company:"",profession:"",religion:"",community:"",relationshipGoal:"",education:"",children:"",pets:"",smoking:"",drinking:"",exercise:"",language:"",languages:[],heightCm:""});
  const profileStates=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh"];
  const profileLanguages=["Hindi","English","Bengali","Telugu","Marathi","Tamil","Urdu","Gujarati","Kannada","Odia","Malayalam","Punjabi","Assamese","Maithili","Sanskrit","Kashmiri","Nepali","Konkani","Sindhi","Dogri","Manipuri","Bodo","Santali","French","German","Spanish","Italian","Portuguese","Russian","Arabic","Chinese","Japanese","Korean","Other"];
  const profileQualifications=["10th / Secondary","12th / Higher Secondary","ITI / Vocational","Diploma","B.A.","B.Com.","B.Sc.","B.Tech / B.E.","BBA","BCA","MBBS","BDS","LLB","B.Ed.","B.Pharm","M.A.","M.Com.","M.Sc.","M.Tech / M.E.","MBA","MCA","MD / MS","LLM","M.Ed.","Ph.D.","Other"];
  const profileReligions=["Hindu","Muslim","Christian","Sikh","Buddhist","Jain","Jewish","Parsi / Zoroastrian","Other","Prefer not to say"];
  const profileCommunities=["General","Brahmin","Baniya","Rajput","Jat","Maratha","Patel","Khatri","Kayastha","Agarwal","Vaishya","Yadav","Gujjar","Reddy","Nair","Lingayat","Vokkaliga","Chettiar","SC","ST","OBC","Other","Prefer not to say"];
  const profileProfessions=["Business / Entrepreneur","Private sector","Government / PSU","Doctor","Engineer","Lawyer","Teacher / Professor","CA / Finance","IT / Software","Designer / Creative","Consultant","Healthcare","Sales / Marketing","Student","Self-employed","Homemaker","Retired","Other"];
  const profileRelationshipGoals=["Marriage","Long-term relationship","Serious relationship","Dating","Friendship first","Open to possibilities"];
  const profileChildren=["No","Want someday","Have and want more","Have and don’t want more","Not sure","Prefer not to say"];
  const profilePets=["No","Yes - dog","Yes - cat","Yes - other","Want pets","Prefer not to say"];
  const profileHeights=Array.from({length:81},(_,i)=>String(140+i));
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
  const [roomBusy, setRoomBusy] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string,number>>({});
  const [profileMenuOpen,setProfileMenuOpen]=useState(false);
  const [profileFilterOpen,setProfileFilterOpen]=useState(false);
  const photoTouchStart=useRef<{id:string;x:number}|null>(null);

  const [showcaseRecording, setShowcaseRecording] = useState<"voice"|"video"|null>(null);
  const [promptRecordingTarget, setPromptRecordingTarget] = useState<{group:"personality"|"partner";index:number}|null>(null);
  const [showcaseBusy, setShowcaseBusy] = useState(false);
  const showcaseRecorderRef = useRef<MediaRecorder | null>(null);
  const showcaseStreamRef = useRef<MediaStream | null>(null);
  const showcaseChunksRef = useRef<Blob[]>([]);
  const [activityDone, setActivityDone] = useState(false);
  const [gameTurn, setGameTurn] = useState<"X"|"O">("X");
  const [gameCells, setGameCells] = useState<string[]>(Array(9).fill(""));
  const [gameQuizIndex, setGameQuizIndex] = useState(0);
  const [gameQuizScore, setGameQuizScore] = useState(0);
  const [gameDicePos, setGameDicePos] = useState(0);
  const [gameDice, setGameDice] = useState(0);
  const [gameTarget, setGameTarget] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gamePrompt, setGamePrompt] = useState("");
  const [experienceRound, setExperienceRound] = useState(1);
  const [experienceScore, setExperienceScore] = useState(0);
  const [experienceChoice, setExperienceChoice] = useState("");
  const premiumGameNames = new Set(["Couple Trivia Battle","Compatibility Clash","Beat the Clock","Word Chain Battle","Picture Puzzle Duel","Guess My Answer","Story Builder","Song Battle","Movie Emoji Battle","Memory About Me","Fast Questions Duel","Cuddl Quest","Two-Person Escape Room","Mystery Match","Love Language Challenge","Future Together","Dream Life Builder","Couple Strategy Game","Cuddl Championship"]);
  const premiumPrompts = ["Choose your answer and compare with your partner.","Ask your partner the same question and reveal together.","Pick one: adventure, comfort, humour or ambition.","Describe your ideal shared weekend in one sentence.","Name one thing that would make a date unforgettable.","Choose the next move together."];
  function startPremiumRound(){setExperienceRound(r=>r+1);setExperienceChoice("");setGamePrompt(premiumPrompts[(experienceRound-1)%premiumPrompts.length]);}
  function answerPremiumRound(){if(roomOpen?.role==="SPECTATOR")return;setExperienceChoice("answered");setExperienceScore(s=>s+1);notify("Point recorded ✦");}
  const [gameLudoPositions, setGameLudoPositions] = useState<number[][]>([[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]]);
  const [ludoTurn, setLudoTurn] = useState(0);
  const [ludoPendingRoll, setLudoPendingRoll] = useState(0);
  const [memoryCards, setMemoryCards] = useState<string[]>([]);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memoryMatched, setMemoryMatched] = useState<number[]>([]);
  const quizQuestions = [
    ["Which planet is known as the Red Planet?",["Earth","Mars","Venus","Jupiter"],1],
    ["Which is the largest ocean?",["Atlantic","Indian","Pacific","Arctic"],2],
    ["Which language has the most native speakers?",["English","Hindi","Mandarin","Spanish"],2],
    ["What does a rainbow contain?",["Only red","Seven colours","Five colours","Ten colours"],1],
    ["Which is a healthy first-date activity?",["Public coffee","Sharing passwords","Skipping safety","Ignoring boundaries"],0]
  ] as [string,string[],number][];
  const promptBank:Record<string,string[]> = {
    "Rapid Fire + Truth & Dare":["Beach or mountains?","What always makes you laugh?","Truth: biggest green flag?","Dare: send your funniest emoji story."],
    "Would You Rather":["Travel the world or build a dream home?","Sunrise date or midnight drive?","Cook together or order in?","Voice call or game night?"],
    "Two Truths & a Lie":["Two true facts and one lie — guess mine.","What's a surprising hobby?","What's something people assume incorrectly about you?","Tell two truths and make one believable lie."],
    "Emoji Guess":["🎬❤️🦁 — guess the movie.","☕🌧️📖 — describe this date.","✈️🏔️📸 — where are we?","🍕🎮🌙 — what kind of night is this?"],
    "Memory Match":["Remember three things your partner says, then repeat them.","Find the matching pair before the timer ends."],
    "Chess Café":["Choose a colour and challenge someone in the room.","Play a friendly opening: no rating pressure."]
  };
  function experienceAccess(name:string,type:"GAME"|"ACTIVITY"){
    const cfg=planConfig?.experiences?.find((x:any)=>x.name===name && x.type===type);
    if(!cfg || planConfig?.launchMode==="FREE_ALL") return {play:true,spectate:true,cfg};
    const plan=user?.user?.plan||"Basic";
    return {play:Array.isArray(cfg.plans)&&cfg.plans.includes(plan),spectate:Array.isArray(cfg.spectatorPlans)&&cfg.spectatorPlans.includes(plan),cfg};
  }
  async function openSpectatorRoom(name:string,icon:string,meta:string){
    setRoomBusy(true); try{const r=await fetch("/api/game-rooms?game="+encodeURIComponent(name));const d=await r.json();const active=(d.rooms||[]).find((x:any)=>x.status==="ACTIVE");if(!active)throw new Error("No live room is available right now.");const j=await fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"join",roomId:active.id,role:"SPECTATOR"})});const jd=await j.json();if(!j.ok)throw new Error(jd.error||"Could not join as spectator.");resetGame();setRoomOpen({type:"Game",icon,name,meta,roomId:jd.room.id,role:"SPECTATOR",status:jd.room.status,state:jd.room.state||{}});notify("Joined as spectator 👀");}catch(e){notify(e instanceof Error?e.message:"No live room available.");}finally{setRoomBusy(false)}
  }
  async function createGameRoom(name:string, icon:string, meta:string){
    setRoomBusy(true);
    try{
      const r=await fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"create",gameKey:name})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Could not create room.");
      resetGame();
      setRoomOpen({type:"Game",icon,name,meta,roomId:d.room.id,role:d.room.role,status:d.room.status,state:{},players:d.room.players||[]});
      notify("Game room created ✦");
    }catch{
      resetGame();
      setRoomOpen({type:"Game",icon,name,meta,roomId:null,role:"HOST",status:"LOCAL",state:{}});
      notify("Solo game started ✦");
    }finally{setRoomBusy(false)}
  }
  async function loadGameRooms(name:string){try{const r=await fetch("/api/game-rooms?game="+encodeURIComponent(name),{cache:"no-store"});const d=await r.json();if(Array.isArray(d.rooms))setAvailableRooms(d.rooms)}catch{}}
  async function joinGameRoom(room:any){setRoomBusy(true);try{const r=await fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"join",roomId:room.id})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not join room.");resetGame();setRoomOpen({type:"Game",icon:roomOpen?.icon||"🎮",name:room.game_key,meta:"Multiplayer game",roomId:d.room.id,role:d.room.role,status:d.room.status,state:d.room.state||{},players:d.room.players||[]});notify("Joined game room 🎮");}catch(e){notify(e instanceof Error?e.message:"Could not join room.");}finally{setRoomBusy(false)}}
  async function updateGameRoom(state:any){if(!roomOpen?.roomId || roomOpen.role==="SPECTATOR")return;await fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update",roomId:roomOpen.roomId,state})}).catch(()=>{})}
  async function closeGameRoom(){if(roomOpen?.roomId)await fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"leave",roomId:roomOpen.roomId})}).catch(()=>{});setRoomOpen(null);setAvailableRooms([])}
  useEffect(()=>{if(!roomOpen?.roomId)return;let live=true;const sync=async()=>{try{const r=await fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"state",roomId:roomOpen.roomId})});const d=await r.json();if(!live||!r.ok||!d.room)return;setRoomOpen((x:any)=>({...x,status:d.room.status,guestUserId:d.room.guest_user_id,state:d.room.state||{},players:d.room.players||x.players||[]}));const s=d.room.state||{};if(s.game==="Tic-Tac-Toe"&&Array.isArray(s.cells)){setGameCells(s.cells);setGameTurn(s.turn==="O"?"O":"X")}
        if(s.game==="Ludo After Work"&&Array.isArray(s.positions)){const p=Array.from({length:4},(_,pi)=>Array.from({length:4},(_,ti)=>Number(s.positions?.[pi]?.[ti]??-1)));setGameLudoPositions(p);setLudoTurn(Number(s.turn||0));setGameDice(Number(s.lastRoll||0));}
        if(s.game==="Memory Match"&&Array.isArray(s.matched)){setMemoryMatched(s.matched);if(Array.isArray(s.cards)&&s.cards.length)setMemoryCards(s.cards)}}catch{}};sync();const t=window.setInterval(sync,1500);return()=>{live=false;window.clearInterval(t)}},[roomOpen?.roomId]);
  useEffect(()=>{if(roomOpen?.type==="Game"&&!roomOpen?.roomId)loadGameRooms(roomOpen.name)},[roomOpen?.type,roomOpen?.name,roomOpen?.roomId]);
  function resetGame(){
    setGameTurn("X"); setGameCells(Array(9).fill("")); setGameQuizIndex(0); setGameQuizScore(0);
    setGameDicePos(0); setGameDice(0); setGameLudoPositions([[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]]); setLudoTurn(0); setLudoPendingRoll(0); setGameTarget(Math.floor(Math.random()*20)); setGameScore(0);
    setGamePrompt(""); setExperienceRound(1); setExperienceScore(0); setExperienceChoice(""); setMemoryFlipped([]); setMemoryMatched([]); setMemoryCards(["💗","🌙","🎵","☕","💗","🌙","🎵","☕"].sort(()=>Math.random()-.5));
  }
  function playTic(i:number){
    if(roomOpen?.role==="SPECTATOR") return notify("Spectator mode — cheer and react instead of playing.");
    if(gameCells[i]) return;
    if(roomOpen?.roomId && roomOpen.role && gameTurn!==(roomOpen.role==="HOST"?"X":"O")) return notify("Wait for your turn.");
    const next=[...gameCells]; next[i]=gameTurn;
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const won=lines.some(([a,b,c])=>next[a]&&next[a]===next[b]&&next[a]===next[c]);
    setGameCells(next);
    if(roomOpen?.roomId) updateGameRoom({game:"Tic-Tac-Toe",cells:next,turn:won||next.every(Boolean)?gameTurn:(gameTurn==="X"?"O":"X"),winner:won?gameTurn:(next.every(Boolean)?"DRAW":null)});
    if(won){notify(gameTurn+" wins Tic-Tac-Toe 🎉");return;}
    if(next.every(Boolean)){notify("Draw! 🤝");return;}
    setGameTurn(gameTurn==="X"?"O":"X");
  }
  function rollDice(){
    if(roomOpen?.role==="SPECTATOR") return notify("Spectator mode — cheer and react instead of rolling.");
    const players=Array.isArray(roomOpen?.players)?roomOpen.players:[];
    const slot=Math.max(0,players.findIndex((x:any)=>String(x.userId)===String(user?.user?.id)));
    const player=slot>=0?slot:0;
    if(roomOpen?.name==="Ludo After Work" && roomOpen?.roomId && player!==ludoTurn) return notify("Wait for your turn.");
    const n=1+Math.floor(Math.random()*6);
    const tokens=gameLudoPositions[player]||[-1,-1,-1,-1];
    const movable=tokens.some((p:number)=>p>=0 && p+n<=56) || (n===6 && tokens.some((p:number)=>p===-1));
    setGameDice(n);
    setLudoPendingRoll(movable?n:0);
    if(!movable){const nextTurn=(player+1)%Math.max(2,Math.min(4,players.length||2));setLudoTurn(nextTurn);if(roomOpen?.roomId)updateGameRoom({game:"Ludo After Work",positions:gameLudoPositions,turn:nextTurn,lastRoll:n,winner:null});notify("No move available — next player.");return;}
    if(n===6&&tokens.some((p:number)=>p===-1)) notify("Six! Choose a token to enter the board.");
  }
  function moveLudoToken(tokenIndex:number){
    if(roomOpen?.role==="SPECTATOR")return notify("Spectator mode — cheer and react instead of rolling.");
    const players=Array.isArray(roomOpen?.players)?roomOpen.players:[];
    const slot=Math.max(0,players.findIndex((x:any)=>String(x.userId)===String(user?.user?.id)));
    const player=slot>=0?slot:0;
    if(player!==ludoTurn||!ludoPendingRoll)return;
    const current=gameLudoPositions[player]?.[tokenIndex]??-1;
    if(current===-1 && ludoPendingRoll!==6)return notify("That token needs a 6 to leave home.");
    if(current>=0 && current+ludoPendingRoll>56)return notify("That token cannot move that far.");
    const next=gameLudoPositions.map(x=>[...x]);
    next[player][tokenIndex]=current===-1?0:current+ludoPendingRoll;
    const finished=next[player].every((p:number)=>p===56);
    const keepTurn=ludoPendingRoll===6&&!finished;
    const nextTurn=keepTurn?player:(player+1)%Math.max(2,Math.min(4,players.length||2));
    setGameLudoPositions(next);setLudoPendingRoll(0);setLudoTurn(nextTurn);
    if(roomOpen?.roomId)updateGameRoom({game:"Ludo After Work",positions:next,turn:nextTurn,lastRoll:ludoPendingRoll,winner:finished?player:null});
    if(finished)notify("Ludo complete — you won! 🏆");
  }
  function flipMemory(i:number){
    if(roomOpen?.role==="SPECTATOR") return notify("Spectator mode — cheer and react instead of playing.");
    if(memoryFlipped.includes(i)||memoryMatched.includes(i)||memoryFlipped.length>=2)return;
    const next=[...memoryFlipped,i]; setMemoryFlipped(next);
    if(next.length===2){
      const match=memoryCards[next[0]]===memoryCards[next[1]];
      if(match){const m=[...memoryMatched,...next];setMemoryMatched(m);setMemoryFlipped([]);if(roomOpen?.roomId)updateGameRoom({game:"Memory Match",cards:memoryCards,matched:m,flipped:[]});if(m.length===memoryCards.length)notify("Memory Match complete! 🧠🎉");}
      else window.setTimeout(()=>setMemoryFlipped([]),700);
    }
  }
  function tapTarget(){
    if(roomOpen?.role==="SPECTATOR") return notify("Spectator mode — cheer and react instead.");
    setGameScore(s=>s+1); setGameTarget(Math.floor(Math.random()*20));
    if(gameScore+1>=10) notify("Snake Sprint complete! 🐍");
  }
  function nextPrompt(){
    const name=String(roomOpen?.name||"Rapid Fire + Truth & Dare");
    const list=promptBank[name]||promptBank["Rapid Fire + Truth & Dare"];
    setGamePrompt(list[Math.floor(Math.random()*list.length)]);
  }
  useEffect(() => { Promise.all([fetch("/api/me"),fetch("/api/plan-config")]).then(async ([m,p])=>{const md=await m.json();const pd=await p.json();if(md.authenticated)setUser(md);if(pd?.plans)setPlanConfig(pd);}).finally(()=>setAuthChecked(true)); }, []);
  useEffect(() => {
    if(!user) return;
    const prefs=user?.profile?.lifestylePreferences||{};
    setDesiredGender(String(prefs.desiredGender||"ANY").toUpperCase());
    const complete=!!user?.profile?.displayName && !!user?.profile?.city && !!prefs.state && !!prefs.gender && !!prefs.desiredGender && String(user?.profile?.bio||"").trim().length>=10 && !!prefs.maritalStatus;
    setProfileOnboarding(!complete);
    setOnboardingPromptOpen(!complete);
    setOnboardingChecked(true);
    fetch("/api/verification/free",{cache:"no-store"}).then(r=>r.json()).then(v=>{
      const status=v?.status||"not_started";
      setFreeVerificationStatus(status);
      if(status==="reverify_required" || (complete && status==="not_started")) setVerificationOpen(true);
    }).catch(()=>{});
  }, [user]);
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
  useEffect(() => { if(!user)return; const t=window.setInterval(()=>{refreshFestival()},10000); return ()=>window.clearInterval(t); }, [user]);
  useEffect(() => { if(!user)return; const t=window.setInterval(async()=>{
    try{
      const [nr,vr]=await Promise.all([fetch("/api/notifications",{cache:"no-store"}),fetch("/api/verification/free",{cache:"no-store"})]);
      const d=await nr.json(); const v=await vr.json();
      if(Array.isArray(d.notifications))setNotifications(d.notifications);
      if(v?.status && v.status!==freeVerificationStatus)setFreeVerificationStatus(v.status);
      if(v?.status==="reverify_required")setVerificationOpen(true);
    }catch{}
  },10000); return ()=>window.clearInterval(t); }, [user,freeVerificationStatus]);
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
    const max=kind==="photo"?5*1024*1024:50*1024*1024;
    if(file.size>max){notify(`Keep ${kind} under ${kind==="photo"?"5MB":"50MB"}`);return;}
    setBottleBusy(true);
    try{
      const blob=await upload(`profile-media/${user?.user?.id||user?.id}/bottle-${kind}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"")}`,file,{access:"private",handleUploadUrl:"/api/profile/media/upload",clientPayload:await getUploadClientPayload()});
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
    setProfileDraft({displayName:String(p.displayName||""),city:String(p.city||""),state:String(lp.state||""),bio:String(p.bio||""),gender:String(lp.gender||""),desiredGender:String(lp.desiredGender||"ANY"),maritalStatus:String(lp.maritalStatus||""),personalityPrompts:Array.isArray(lp.personalityPrompts)?lp.personalityPrompts.map((x:any)=>({...x})):[],partnerPrompts:Array.isArray(lp.partnerPrompts)?lp.partnerPrompts.map((x:any)=>({...x})):[],profileShowcase:Array.isArray(lp.profileShowcase)?lp.profileShowcase:[],personalityStickers:Array.isArray(lp.personalityStickers)?lp.personalityStickers:[],foodPreference:String(lp.foodPreference||""),diet:String(lp.diet||""),company:String(lp.company||""),profession:String(lp.profession||""),religion:String(lp.religion||""),community:String(lp.community||""),relationshipGoal:String(lp.relationshipGoal||""),education:String(lp.education||""),children:String(lp.children||""),pets:String(lp.pets||""),smoking:String(lp.smoking||""),drinking:String(lp.drinking||""),exercise:String(lp.exercise||""),language:String(lp.language||""),languages:Array.isArray(lp.languages)?lp.languages.map(String):(lp.language?[String(lp.language)]:[]),heightCm:String(lp.heightCm||""),locationGranted:!!lp.locationGranted,locationLatitude:String(lp.locationLatitude||""),locationLongitude:String(lp.locationLongitude||""),locationAccuracy:String(lp.locationAccuracy||"")});
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
    const max=kind==="photo"?5*1024*1024:50*1024*1024;
    if(file.size>max){notify(`Please keep the ${kind} under ${kind==="photo"?"5MB":"50MB"}`);return;}
    if(kind==="photo" && "FaceDetector" in window){
      try{
        const detector=new (window as any).FaceDetector({fastMode:true,maxDetectedFaces:4});
        const bitmap=await createImageBitmap(file);
        const faces=await detector.detect(bitmap);
        bitmap.close();
        if(faces.length>1){notify("Group photo detected. Prompt photos must show you alone.");return;}
        if(faces.length===0){notify("No clear face detected. Please use a clear personal photo.");return;}
      }catch{}
    }
    setShowcaseBusy(true);
    try{
      const ext=(file.name.split(".").pop()||"webm").toLowerCase();
      const blob=await upload(`profile-media/${user?.user?.id||user?.id}/prompt-${group}-${index}-${kind}-${Date.now()}.${ext}`,file,{
        access:"private",
        handleUploadUrl:"/api/profile/media/upload",clientPayload:await getUploadClientPayload(),
        contentType:file.type,
        multipart:kind==="video" && file.size>4*1024*1024
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
          const blobResult=await upload(`profile-media/${user?.user?.id||user?.id}/prompt-${group}-${index}-voice-${Date.now()}.${ext}`,new File([blob],`cuddl-prompt-voice-${Date.now()}.webm`,{type:mime}),{access:"private",handleUploadUrl:"/api/profile/media/upload",clientPayload:await getUploadClientPayload()});
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

  async function getUploadClientPayload(){
    const r=await fetch("/api/profile/media/upload",{cache:"no-store"});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Could not authorize media upload");
    return String(d.clientPayload||"");
  }
  async function uploadProfileShowcase(file:File, kind:"photo"|"voice"|"video"){
    if(!user?.user?.id && !user?.id)return;
    const max=kind==="photo"?5*1024*1024:50*1024*1024;
    if(file.size>max){notify(`Please keep the ${kind} under ${kind==="photo"?"5MB":"50MB"}`);return;}
    if(kind==="photo" && "FaceDetector" in window){
      try{
        const detector=new (window as any).FaceDetector({fastMode:true,maxDetectedFaces:4});
        const bitmap=await createImageBitmap(file);
        const faces=await detector.detect(bitmap);
        bitmap.close();
        if(faces.length>1){notify("Group photo detected. Only photos showing you alone are allowed.");return;}
        if(faces.length===0){notify("No clear face detected. Please upload a clear personal photo.");return;}
      }catch{}
    }
    setShowcaseBusy(true);
    try{
      const ext=(file.name.split(".").pop()||({photo:"jpg",voice:"webm",video:"webm"} as any)[kind]).toLowerCase();
      const blob=await upload(`profile-media/${user?.user?.id||user?.id}/${kind}-${Date.now()}.${ext}`,file,{
        access:"private",
        handleUploadUrl:"/api/profile/media/upload",clientPayload:await getUploadClientPayload()
      });
      const item={kind,pathname:blob.pathname,prompt:kind==="photo"?"📸 My photo":kind==="voice"?"🎙️ My voice":"🎥 My vibe"};
      setProfileDraft((d:any)=>{
        const current=Array.isArray(d.profileShowcase)?d.profileShowcase:[];
        const next=kind==="photo"
          ? [...current.filter((x:any)=>x.kind==="photo"),item].slice(-6).concat(current.filter((x:any)=>x.kind!=="photo"))
          : [...current.filter((x:any)=>x.kind!==kind),item];
        return {...d,profileShowcase:next.slice(0,8)};
      });
      notify(kind==="photo"?"Photo added to your showcase":kind==="voice"?"Voice intro added":"Video intro added");
    }catch(err){notify(err instanceof Error?err.message:"Could not upload showcase media");}
    finally{setShowcaseBusy(false);}
  }
  async function handleShowcaseFile(e:React.ChangeEvent<HTMLInputElement>,kind:"photo"|"video"){
    const files=Array.from(e.currentTarget.files||[]);
    if(!files.length)return;
    try{
      if(kind==="photo"){
        for(const file of files) await uploadProfileShowcase(file,"photo");
      }else{
        await uploadProfileShowcase(files[0],"video");
      }
    }finally{
      e.currentTarget.value="";
    }
  }
  async function startShowcaseRecording(kind:"voice"|"video"){
    if(showcaseRecording)return;
    if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined"){notify("Recording is not supported in this browser");return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:kind==="video"});
      showcaseStreamRef.current=stream;
      const preferred=kind==="video"?"video/webm;codecs=vp8,opus":"audio/webm;codecs=opus";
      const mime=MediaRecorder.isTypeSupported(preferred)?preferred:(kind==="video"?"video/webm":"audio/webm");
      const recorder=new MediaRecorder(stream,{mimeType:mime});
      showcaseChunksRef.current=[];
      recorder.ondataavailable=(e)=>{if(e.data.size)showcaseChunksRef.current.push(e.data);};
      recorder.onstop=async()=>{
        const blob=new Blob(showcaseChunksRef.current,{type:mime});
        const ext="webm";
        const uploadType=kind==="video"?"video/webm":"audio/webm";
        await uploadProfileShowcase(new File([blob],`cuddl-${kind}-${Date.now()}.webm`,{type:uploadType}),kind);
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
    const showcase=Array.isArray(profileDraft.profileShowcase)?profileDraft.profileShowcase:[];
    const hasSelfPhoto=showcase.some((x:any)=>x?.kind==="photo" && x?.pathname);
    if(!hasSelfPhoto){notify("At least 1 personal photo is required to complete your profile.");return;}
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
      if(complete){setTab("discover");notify("Profile saved successfully");} else notify("Please complete the required profile details, including marital status");
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
  const showDiscoveryAd=!!planConfig?.adSettings?.enabled && (planConfig?.adSettings?.freePlans||["Basic"]).includes("Basic") && index>0 && index%Math.max(1,Number(planConfig?.adSettings?.frequency)||10)===0;
  const person = useMemo(() => searchableProfiles.length ? searchableProfiles[index % searchableProfiles.length] : {displayName:"",name:"",age:0,city:"",initial:"",tags:[],score:0,bio:"",lifestylePreferences:{}}, [index, searchableProfiles]);
  useEffect(()=>{ if(!user || !searchableProfiles.length || showDiscoveryAd) return; const p=searchableProfiles[index % searchableProfiles.length]; if(!p?.id) return; fetch("/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:"discover_profile_view",featureKey:"discovery",metadata:{profileId:p.id,position:index+1}})}).catch(()=>{}); },[user,index,searchableProfiles.length,showDiscoveryAd]);
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
      if(!submit.ok){
        if(result.status==="reverify_required"){
          setFreeVerificationStatus("reverify_required");
          setVerificationOpen(true);
          setFreeVerificationFiles({front:null,left:null,right:null});
          stopFreeCamera();
          notify("AI verification failed. Please capture fresh selfies and try again.");
          return;
        }
        throw new Error(result.error||"Could not submit verification");
      }
      setFreeVerificationStatus(result.status==="ai_verified"?"ai_verified":"ai_pending");
      setFreeVerificationFiles({front:null,left:null,right:null});
      stopFreeCamera();
      setVerificationOpen(false);
      setOnboardingPromptOpen(false);
      setProfileModal(null);
      notify("Verification submitted successfully ✓ You can now complete your profile.");
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

  const nav = [["discover","heart","Discover"],["lounge","game","Lounge"],["matches","chat","Chat"],["dates","spark","Dates"],["profile","profile","Profile"]] as const;

  const AppIcon=({name,size=22}:{name:string;size?:number})=>{
    const paths:Record<string,string[]>={
      heart:["M20.8 8.9c0 5.2-8.8 10.2-8.8 10.2S3.2 14.1 3.2 8.9A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.6Z"],
      game:["M6.5 8h11a4.5 4.5 0 0 1 4.2 6.1l-1.4 3.6a2.3 2.3 0 0 1-4.1.4L14.7 15H9.3l-1.5 3.1a2.3 2.3 0 0 1-4.1-.4l-1.4-3.6A4.5 4.5 0 0 1 6.5 8Z","M8 11v4","M6 13h4","M16 12h.01","M18 14h.01"],
      match:["M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z","M8 9h8","M8 13h5"],
      chat:["M5.2 5.2h13.6A2.2 2.2 0 0 1 21 7.4v7.2a2.2 2.2 0 0 1-2.2 2.2H11l-4.8 3v-3H5.2A2.2 2.2 0 0 1 3 14.6V7.4a2.2 2.2 0 0 1 2.2-2.2Z","M7 9.5h10","M7 13h6"],
      spark:["M12 2.8l1.7 5.5 5.5 1.7-5.5 1.7-1.7 5.5-1.7-5.5-5.5-1.7 5.5-1.7Z"],
      bottle:["M9 3h6","M10 3v5l-4.2 7.1A3.2 3.2 0 0 0 8.5 20h7a3.2 3.2 0 0 0 2.7-4.9L14 8V3","M7.5 14h9"],
      profile:["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z","M4 21a8 8 0 0 1 16 0"],
      briefcase:["M5 7.5h14A2 2 0 0 1 21 9.5v8A2 2 0 0 1 19 19.5H5a2 2 0 0 1-2-2v-8A2 2 0 0 1 5 7.5Z","M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5","M3 12h18"],
      education:["M3 9l9-5 9 5-9 5-9-5Z","M6 11.2v5.2c3.7 2.2 8.3 2.2 12 0v-5.2","M21 10v5"],
      relationship:["M12 20s-7-4.2-7-9.1A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.9C19 15.8 12 20 12 20Z"],
      food:["M5 4v7","M3 4v7M7 4v7","M5 11v9","M15 4v16","M15 4c4 1 5 4 5 6h-5"],
      leaf:["M20 4C10 4 4 8 4 16c0 2 1 4 4 4 8 0 12-6 12-16Z","M4 20c3-5 7-8 12-10"],
      vegan:["M19 5C9 5 4 9 4 16c0 3 2 4 4 4 7 0 11-5 11-15Z","M4 20c3-4 7-7 12-9"],
      smoke:["M3 16h13","M16 16c0-3 2-5 5-5","M18 8c2 0 3 1 3 3"],
      drink:["M5 4h14l-1 5c-.5 2-2 3-3.5 4v5h3v2H6v-2h3v-5C7.5 12 6 11 5.5 9Z","M7 9h10"],
      child:["M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z","M6 21v-2a6 6 0 0 1 12 0v2","M9 15h6"],
      pet:["M8 10a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM20 10a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM12 13a4 4 0 0 0-4 4c0 2 2 3 4 1 2 2 4 1 4-1a4 4 0 0 0-4-4Z"],
      noPet:["M8 10a2 2 0 1 0-4 0M20 10a2 2 0 1 0-4 0","M6 17l12-10","M12 13a4 4 0 0 0-4 4c0 2 2 3 4 1 2 2 4 1 4-1"],
      religion:["M12 3v8","M8 7h8","M5 20h14","M7 16h10l-2-5H9Z"],
      community:["M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a2.5 2.5 0 1 0 0-5","M3 20a5 5 0 0 1 10 0M14 20a4 4 0 0 1 7 0"]
    };
    return <svg className="app-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{(paths[name]||[]).map((d,i)=>d.includes("M")?<path key={i} d={d}/>:<circle key={i} cx="16" cy="12" r="1" />)}</svg>;
  };

  const myShowcase=Array.isArray(user?.profile?.lifestylePreferences?.profileShowcase)
    ? user.profile.lifestylePreferences.profileShowcase : [];
  const myVisualMedia=myShowcase.filter((x:any)=>x?.kind==="photo"||x?.kind==="video").slice(0,6);
  const myProfilePhoto=myVisualMedia.find((x:any)=>x.kind==="photo")||myVisualMedia[0]||null;
  const myProfileAvatarSrc=myProfilePhoto?.pathname
    ? "/api/profile/media?pathname="+encodeURIComponent(myProfilePhoto.pathname) : "";
  const myProfileInitial=String(user?.profile?.displayName||"U").slice(0,1).toUpperCase();
  const myVerification=(user?.profile?.verification||{}) as Record<string,any>;

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
{authMode==="register" && <div className="safe">After registration, Cuddl runs a first-level AI identity check against your profile photo. If it passes, you can continue using the app while the Cuddl team completes the final manual review.</div>}
<button className="btn" disabled={authBusy}>{authBusy?"Please wait…":authMode==="login"?"Sign in":"Create account & verify"}</button></form>{authMode==="login" && <button type="button" className="forgot-link" onClick={()=>{setForgotEmail(authForm.email);setForgotOpen(true);}}>Forgot password?</button>}<button className="btn ghost auth-switch" onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setAuthError("");}}>{authMode==="login"?"New to Cuddl? Create an account":"Already have an account? Sign in"}</button></main></div>;

  return (
    <div className="cuddl-app">
      <header className="topbar">
        <div className="brand">Cuddl</div>
        <div className="topbar-actions">
          <button className="top-action-link" aria-label="Open notifications" onClick={()=>setNotificationOpen(true)}>
            <span className="top-action-icon"><AppIcon name="spark" size={21}/></span><span>Alerts</span>
            {notifications.some((n:any)=>!n.read)&&<b className="notification-badge">{notifications.filter((n:any)=>!n.read).length>9?"9+":notifications.filter((n:any)=>!n.read).length}</b>}
          </button>
          <button className="top-profile-link" aria-label="Open profile" onClick={()=>setTab("profile")}>
            <span className="top-profile-avatar">{myProfileAvatarSrc?<img loading="eager" decoding="async" src={myProfileAvatarSrc} alt="" />:myProfileInitial}</span>
            <span>Profile</span>
          </button>
          <button className="icon-btn heart-icon-btn" aria-label="Safety Center" onClick={() => notify("Safety Center ready")}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.9c0 5.2-8.8 10.2-8.8 10.2S3.2 14.1 3.2 8.9A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.6Z"/></svg></button>
        </div>
      </header>

      <main className="content">
        {festival && <button className="festival-banner" onClick={openFestival}><span>{festival.festival.coverEmoji}</span><div><b>{festival.festival.name} is live</b><small>{festival.festival.tagline || "Roam freely between special activities for a limited time."}</small></div><strong>Explore →</strong></button>}
        {tab === "discover" && <>
          <div className="eyebrow">Smart discovery</div>
          <h1 className="hero-title">Find the right people for you.</h1>
          <p className="sub">Browse naturally. Your detailed discovery preferences are available from <b>Profile → Menu → Search & discovery filters</b>.</p>
 



          {showDiscoveryAd ? <section className="panel discovery-ad-slot"><div className="ad-kicker">ADVERTISEMENT</div><div className="ad-placeholder"><span>Sponsored</span><b>Support Cuddl while you explore</b><p>Free access is supported by relevant advertising. You can continue discovering profiles after this short placement.</p><button className="btn ghost" onClick={()=>notify("Ad placement is active for free users.")}>Why am I seeing this?</button></div></section> : searchableProfiles.length > 0 && <section className="panel single-profile-panel">
            <div className="eyebrow">Profile</div>
            <div className="discover-photo"
              onTouchStart={e=>{if(personPhotos.length>1)photoTouchStart.current={id:String(person.id||person.name),x:e.touches[0].clientX}}}
              onTouchEnd={e=>{const st=photoTouchStart.current;if(!st)return;photoTouchStart.current=null;const dx=e.changedTouches[0].clientX-st.x;if(Math.abs(dx)>45)changePhoto(st.id,personPhotos.length,dx<0?1:-1)}}
              onPointerDown={e=>{if(personPhotos.length>1)photoTouchStart.current={id:String(person.id||person.name),x:e.clientX}}}
              onPointerUp={e=>{const st=photoTouchStart.current;if(!st)return;photoTouchStart.current=null;const dx=e.clientX-st.x;if(Math.abs(dx)>45)changePhoto(st.id,personPhotos.length,dx<0?1:-1)}}
            >
              {personPhotos.length ? <img loading="eager" decoding="async" src={personPhotos[photoIndexes[person.id]||0]} alt={person.displayName||person.name||"Cuddl profile"} draggable={false}/> : <div className="discover-avatar">{person.initial}</div>}
              {personPhotos.length>1 && <span className="photo-count">{(photoIndexes[person.id||person.name]||0)+1}/{personPhotos.length}</span>}
            </div>
            <div className="profile-row profile-heading"><div className="grow"><h2 style={{margin:"4px 0"}}>{person.displayName ?? person.name}{person.age ? `, ${person.age}` : ""} ✓</h2><div className="sub">⌖ {person.city || "Location hidden"} · {person.activeNow ? <span className="active-now"><span className="active-dot"/>Active now</span> : "Recently active"}</div><div className="trust-badges">{person.verification?.adminVerificationStatus==="verified"&&<span className="trust-badge">✓ Cuddl Verified</span>}{person.verification?.photoVerified&&<span className="trust-badge">✓ Photo Verified</span>}{person.verification?.phoneVerified&&<span className="trust-badge">✓ Phone Verified</span>}{person.verification?.emailVerified&&<span className="trust-badge">✓ Email Verified</span>}{person.verification?.aiAutoVerified&&person.verification?.adminVerificationStatus!=="verified"&&<span className="trust-badge ai">✓ AI Verified</span>}</div></div><span className="score">{person.score||88}%</span></div>
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
            <div className="profile-facts">
              {person.lifestylePreferences?.profession&&<div><i><AppIcon name="briefcase" size={18}/></i><b>Profession</b><span>{person.lifestylePreferences.profession}{person.lifestylePreferences?.company?" · "+person.lifestylePreferences.company:""}</span></div>}
              {person.lifestylePreferences?.education&&<div><i><AppIcon name="education" size={18}/></i><b>Education</b><span>{person.lifestylePreferences.education}</span></div>}
              {person.lifestylePreferences?.relationshipGoal&&<div><i><AppIcon name="relationship" size={18}/></i><b>Looking for</b><span>{person.lifestylePreferences.relationshipGoal}</span></div>}
              {person.lifestylePreferences?.foodPreference&&<div><i><AppIcon name="food" size={18}/></i><b>Food preference</b><span>{person.lifestylePreferences.foodPreference}</span></div>}
              {person.lifestylePreferences?.diet&&<div><i><AppIcon name={String(person.lifestylePreferences.diet).toLowerCase().includes("vegan")?"vegan":String(person.lifestylePreferences.diet).toLowerCase().includes("veget")?"leaf":"food"} size={18}/></i><b>Diet</b><span>{person.lifestylePreferences.diet}</span></div>}
              {person.lifestylePreferences?.smoking&&<div><i><AppIcon name="smoke" size={18}/></i><b>Smoking</b><span>{person.lifestylePreferences.smoking}</span></div>}
              {person.lifestylePreferences?.drinking&&<div><i><AppIcon name="drink" size={18}/></i><b>Drinking</b><span>{person.lifestylePreferences.drinking}</span></div>}
              {person.lifestylePreferences?.children&&<div><i><AppIcon name="child" size={18}/></i><b>Children</b><span>{person.lifestylePreferences.children}</span></div>}
              {person.lifestylePreferences?.pets&&<div><i><AppIcon name={String(person.lifestylePreferences.pets).toLowerCase().includes("no pets")?"noPet":"pet"} size={18}/></i><b>Pets</b><span>{person.lifestylePreferences.pets}</span></div>}
              {person.lifestylePreferences?.religion&&<div><i><AppIcon name="religion" size={18}/></i><b>Religion</b><span>{person.lifestylePreferences.religion}</span></div>}
              {person.lifestylePreferences?.community&&<div><i><AppIcon name="community" size={18}/></i><b>Community</b><span>{person.lifestylePreferences.community}</span></div>}
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
          <div className="lounge-grid">
          {activities.map(([icon,name,tags,count],idx) => {const a=experienceAccess(name,"ACTIVITY"); const faces=[["AN","Aanya"],["RK","Riya"],["MS","Meera"],["KV","Kavya"],["RJ","Raj"]].slice(0,3+(idx%2)); return <article className="lounge-card" key={name}>
            <div className="lounge-card-visual"><div className="room-icon lounge-icon">{icon}</div><span className="live-dot">● LIVE</span><div className="participant-stack">{faces.map(([initial,n],i)=><span key={n} title={n} className={"participant p"+i}>{initial}</span>)}<span className="participant more">+{count.split("/")[0]}</span></div></div>
            <div className="lounge-card-body"><div className="eyebrow">{tags.split(" · ")[0]}</div><h3>{name}</h3><p>{count} people are in this experience</p><div className="lounge-card-foot"><span className="join-note">👥 Meet · play · react</span>{a.play?<button className="join" onClick={() => {setActivityDone(false);setRoomOpen({type:"Activity",icon,name,meta:tags+" · "+count+" participants active",role:"PLAYER"})}}>Join</button>:a.spectate?<button className="join" onClick={() => {setActivityDone(false);setRoomOpen({type:"Activity",icon,name,meta:tags+" · "+count+" participants active",role:"SPECTATOR"})}}>Watch</button>:<button className="join" onClick={()=>notify("Upgrade to join this activity.")}>Upgrade</button>}</div></div>
          </article>})}
          </div>

          <div className="eyebrow" style={{marginTop:28}}>Games</div>
          <div className="lounge-grid games-grid">
          {games.map(([icon,name,meta],idx) => {const a=experienceAccess(name,"GAME"); const faces=[["SK","Sahil"],["AN","Aanya"],["RM","Rohan"],["NK","Neha"]].slice(0,2+(idx%3)); return <article className="lounge-card game-card" key={name}>
            <div className="lounge-card-visual game-visual"><div className="room-icon lounge-icon">{icon}</div><span className={idx%3===2?"waiting-pill":"live-dot"}>{idx%3===2?"OPEN":"● LIVE"}</span><div className="participant-stack">{faces.map(([initial,n],i)=><span key={n} title={n} className={"participant p"+i}>{initial}</span>)}<span className="participant more">+{Math.max(1,(idx+2))}</span></div></div>
            <div className="lounge-card-body"><div className="eyebrow">GAME · {idx<14?"SOCIAL":"PREMIUM"}</div><h3>{name}</h3><p>{meta}</p><div className="lounge-card-foot"><span className="join-note">👥 {idx%3===2?"Waiting for players":"Players live now"}</span>{a.play?<button className="join" disabled={roomBusy} onClick={()=>createGameRoom(name,icon,meta)}>Play</button>:a.spectate?<button className="join" disabled={roomBusy} onClick={()=>openSpectatorRoom(name,icon,meta)}>Watch</button>:<button className="join" onClick={()=>notify("Upgrade to unlock this game.")}>Upgrade</button>}</div></div>
          </article>})}
          </div>

          {(loungeFilter==="All"||loungeFilter==="Music") && <><div className="eyebrow" style={{marginTop:28}}>Music</div>
          <div className="lounge-grid music-grid">
          {music.map(([icon,name,meta],idx) => <article className="lounge-card music-card" key={name}>
            <div className="lounge-card-visual music-visual"><div className="room-icon lounge-icon">{icon}</div><span className="live-dot">● LIVE</span><div className="participant-stack"><span className="participant p0">AN</span><span className="participant p1">RK</span><span className="participant p2">MS</span><span className="participant more">+{idx+6}</span></div></div>
            <div className="lounge-card-body"><div className="eyebrow">MUSIC · LIVE ROOM</div><h3>{name}</h3><p>{meta}</p><div className="lounge-card-foot"><span className="join-note">🎙 Mic optional · 🎉 React</span><button className="join" onClick={()=>setRoomOpen({type:"Music",icon,name,meta})}>Join</button></div></div>
          </article>)}
          </div></>}
        </>}

        {tab === "matches" && <>
          <div className="eyebrow">Conversations</div><h1 className="hero-title">Chat & matches.</h1><p className="sub">Your conversations, mutual connections and shared experiences.</p>
          <div className="panel messages-shortcut"><div><b>💬 Messages</b><p className="sub">Your chats live here. New message alerts also appear at the top.</p></div><button className="btn" onClick={()=>document.querySelector(".chat-panel")?.scrollIntoView({behavior:"smooth",block:"start"})}>Open chat</button></div>
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
            <div className="bottle-upload-row"><label className="prompt-media-btn">📸 Photo<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)addBottleMedia(f,"photo");e.currentTarget.value=""}}/></label><label className="prompt-media-btn">🎥 Video<input type="file" accept="video/*" onChange={e=>{const f=e.target.files?.[0];if(f)addBottleMedia(f,"video");e.currentTarget.value=""}}/></label><button className="prompt-media-btn" onClick={async()=>{if(!navigator.mediaDevices?.getUserMedia){notify("Voice recording is not supported");return;}try{const s=await navigator.mediaDevices.getUserMedia({audio:true});const rec=new MediaRecorder(s);const chunks:Blob[]=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);rec.onstop=async()=>{s.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:rec.mimeType||"audio/webm"});const file=new File([blob],"bottle-voice.webm",{type:blob.type});const b=await upload(`profile-media/${user?.user?.id||user?.id}/bottle-voice-${Date.now()}.webm`,file,{access:"private",handleUploadUrl:"/api/profile/media/upload",clientPayload:await getUploadClientPayload()});setBottleMedia(m=>[...m,{kind:"voice",pathname:b.pathname}]);};rec.start();setTimeout(()=>rec.state==="recording"&&rec.stop(),20000);notify("Recording voice note…");}catch{notify("Microphone permission was not granted")}}}>🎙️ Voice</button></div>
            {bottleMedia.length>0&&<div className="bottle-media-list">{bottleMedia.map((m,i)=><div key={m.pathname||i}>{m.kind==="photo"?"📸 Photo":m.kind==="video"?"🎥 Video":"🎙️ Voice note"} <button className="chip" onClick={()=>setBottleMedia(x=>x.filter((_,j)=>j!==i))}>Remove</button></div>)}</div>}
            <button className="btn" disabled={bottleBusy} onClick={throwBottle}>🌊 Throw bottle into the ocean</button>
          </div>}
          {bottleData?.active&&<div className="panel"><b>🌊 Your bottle is drifting</b><p className="sub">You can throw another bottle only after this one has been opened. Monthly usage: {bottleData.usedThisMonth}/{bottleData.plan==="PREMIUM"?5:2}.</p></div>}
          {bottleData?.plan==="BASIC"&&<div className="panel"><b>🔒 Pro & Premium feature</b><p className="sub">Message in a Bottle is reserved for Pro and Premium members. Upgrade when billing is available.</p><button className="btn ghost" onClick={()=>openLegal("/plans")}>View plans</button></div>}
        </>}

        {tab === "profile" && <>
          <div className="eyebrow">Your profile · {city}</div>
          <h1 className="hero-title">This is how people meet you.</h1><button className="profile-menu-inline" onClick={()=>setProfileMenuOpen(true)}>☰ Menu</button>
          <div className="panel profile-tinder-card">
            <div className="profile-tinder-media">
              {myVisualMedia.length>0 ? myVisualMedia.map((x:any,i:number)=>{
                const src=x.pathname?"/api/profile/media?pathname="+encodeURIComponent(x.pathname):"";
                return <div className="profile-tinder-thumb" key={x.pathname||i}>{x.kind==="video"?<video muted playsInline preload="metadata" src={src}/>:<img loading="lazy" decoding="async" src={src} alt="" />}</div>;
              }) : <div className="profile-tinder-empty"><span className="top-profile-avatar large">{myProfileInitial}</span><div><b>Add your first profile photo</b><small>Your photos and videos will appear here.</small></div></div>}
            </div>
            <div className="profile-tinder-copy"><div><h2>{user?.profile?.displayName||"Your profile"}</h2><p className="sub">{user?.profile?.city||city}</p></div><p className="profile-bio">{user?.profile?.bio||"Add a short bio so people know what makes you, you."}</p></div>
            <div className="trust-badges profile-trust-badges">{myVerification.adminVerificationStatus==="verified"&&<span className="trust-badge">✓ Cuddl Verified</span>}{myVerification.aiAutoVerified&&myVerification.adminVerificationStatus!=="verified"&&<span className="trust-badge ai">✓ AI Verified</span>}{myVerification.photoVerified&&<span className="trust-badge">✓ Photo Verified</span>}{myVerification.phoneVerified&&<span className="trust-badge">✓ Phone Verified</span>}{myVerification.emailVerified&&<span className="trust-badge">✓ Email Verified</span>}</div><div className="actions"><button className="btn" onClick={openProfileEditor}>Edit profile</button><button className="btn ghost" onClick={()=>setMediaOpen(true)}>Photos & videos</button><button className="btn ghost" onClick={()=>setBoostOpen(true)}>🚀 Boost</button><button className="btn ghost" onClick={()=>setVerificationOpen(true)}>{freeVerificationStatus==="verified"?"✓ Cuddl Verified":freeVerificationStatus==="ai_verified"?"✓ AI Verified":freeVerificationStatus==="reverify_required"?"Re-verify identity":"Verify identity"}</button><button className="btn ghost" onClick={logout}>Sign out</button></div>
          </div>
          <section className="profile-preview-entry">
            <div>
              <div className="eyebrow">Profile preview</div>
              <h3>See your profile as a visitor</h3>
              <p className="sub">Open a clean, separate preview that uses the same profile presentation other Cuddl members see.</p>
            </div>
            <button className="btn" onClick={()=>window.location.href="/profile/preview"}>Preview profile →</button>
          </section>

          {profileFilterOpen && <section className="profile-discovery-filters">
            <div className="profile-menu-section-head"><div><div className="eyebrow">Discovery preferences</div><h3>Search & discovery filters</h3><p className="sub">Set the kind of people you want to meet. These controls stay inside your Profile menu, not on the Discover home screen.</p></div><button className="btn ghost" onClick={()=>setProfileFilterOpen(false)}>Done</button></div>
            <div className="filter-section-title">Basics</div>
            <div className="filter-grid">
              {filterField("ageMin","Min age")}{filterField("ageMax","Max age")}{filterField("gender","Gender",["MALE","FEMALE","NON_BINARY","OTHER"])}{filterField("city","City")}{filterField("state","State")}{filterField("distance","Within km",["5","10","25","50","100","250"])}
            </div>
            <div className="filter-section-title">Work & background</div>
            <div className="filter-grid">
              {filterField("company","Company")}{filterField("profession","Profession")}{filterField("religion","Religion")}{filterField("community","Community")}{filterField("education","Education")}{filterField("relationshipGoal","Relationship goal")}
            </div>
            <div className="filter-section-title">Lifestyle</div>
            <div className="filter-grid">
              {filterField("food","Food preference")}{filterField("diet","Diet",["Vegetarian","Vegan","Eggetarian","Jain","Non-vegetarian","Anything"])}{filterField("smoking","Smoking",["Never","Occasionally","Regularly","Prefer not to say"])}{filterField("drinking","Drinking",["Never","Occasionally","Socially","Regularly","Prefer not to say"])}{filterField("children","Children",["Want children","Have children","Do not want","Open to it"])}{filterField("pets","Pets",["Love pets","Have pets","No pets","Open to pets"])}{filterField("exercise","Exercise",["Daily","Often","Sometimes","Rarely"])}{filterField("language","Language")}
            </div>
            <div className="filter-section-title">Physical & trust</div>
            <div className="filter-grid">
              {filterField("heightMin","Min height (cm)")}{filterField("heightMax","Max height (cm)")}{filterField("verified","Identity",["yes",""])}{filterField("photos","Photos",["yes",""])}
            </div>
            <div className="actions"><button className="btn ghost" onClick={clearSearchFilters}>Clear all</button><span className="safe">Filters apply instantly</span></div>
          </section>}

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
          <section className="profile-tools profile-tools-bottom">
            <button className="profile-menu-trigger" onClick={()=>setProfileMenuOpen(true)}>
              <span><b>☰ Profile menu</b><small>Search preferences, privacy, help, plans & legal</small></span><strong>›</strong>
            </button>
          </section>
        </>}
      </main>

      {profileMenuOpen && <div className="overlay popup-overlay" onClick={()=>setProfileMenuOpen(false)}>
        <div className="profile-menu-sheet" onClick={e=>e.stopPropagation()}>
          <div className="profile-menu-head"><div><div className="eyebrow">Profile menu</div><h2>Settings & preferences</h2></div><button className="icon-btn" onClick={()=>setProfileMenuOpen(false)}>×</button></div>
          <button className="menu-row" onClick={()=>{setProfileMenuOpen(false);setTab("profile");setProfileFilterOpen(true);setTimeout(()=>document.querySelector(".profile-discovery-filters")?.scrollIntoView({behavior:"smooth",block:"center"}),80)}}><span>🔎<b>Search & discovery filters</b><small>Age, location, lifestyle, preferences & trust</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>{setProfileMenuOpen(false);setPermissionsOpen(true)}}><span>🔐<b>Permissions</b><small>Location, camera, microphone & notifications</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>{setProfileMenuOpen(false);setProfileModal("privacy")}}><span>🛡️<b>Privacy</b><small>Control how your information is used</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>{setProfileMenuOpen(false);openReferral()}}><span>🎁<b>Refer & earn</b><small>Referral code, sharing and rewards</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>{setProfileMenuOpen(false);openLegal("/plans")}}><span>💎<b>Plans & Premium</b><small>Plans, pricing and offers</small></span><strong>›</strong></button>
          <div className="menu-divider"/>
          <button className="menu-row" onClick={()=>window.location.href="/help"}><span>❓<b>Help & Feedback</b><small>Get help or tell us what to improve</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>openLegal("/privacy")}><span>📄<b>Privacy Policy</b><small>How Cuddl handles personal information</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>openLegal("/terms")}><span>📜<b>Terms & Conditions</b><small>Rules for using Cuddl</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>openLegal("/disclaimer")}><span>⚖️<b>Disclaimer</b><small>Important product and safety information</small></span><strong>›</strong></button>
          <button className="menu-row" onClick={()=>openLegal("/legal-resolution")}><span>🧾<b>Legal resolution</b><small>Questions, disputes and resolutions</small></span><strong>›</strong></button>
        </div>
      </div>}
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
      {roomOpen && <div className="overlay experience-overlay">
        <div className="experience-stage">
          <header className="experience-head">
            <div className="experience-title">
              <div className="experience-mark">{roomOpen.icon}</div>
              <div><div className="eyebrow">{roomOpen.type==="Game"?"LIVE GAME":"LIVE ACTIVITY"}</div><h2>{roomOpen.name}</h2><p>{roomOpen.meta||"A shared Cuddl experience"}</p></div>
            </div>
            <button className="icon-btn experience-close" onClick={roomOpen.type==="Game"?closeGameRoom:()=>setRoomOpen(null)} aria-label="Close">×</button>
          </header>

          {roomOpen.type==="Game" && <div className="experience-players">
            <div className={"experience-player "+(roomOpen.role==="HOST"?"is-you":"")}><div className="experience-avatar">{roomOpen.role==="GUEST"?"O":"S"}</div><div><b>{roomOpen.role==="GUEST"?"Opponent":"You"}</b><span>{roomOpen.role==="GUEST"?"Player O":"Player X"}</span></div></div>
            <div className="experience-vs">VS</div>
            <div className={"experience-player "+(roomOpen.role==="GUEST"?"is-you":"")}><div className="experience-avatar alt">{roomOpen.role==="GUEST"?"S":roomOpen.status==="ACTIVE"?"O":"?"}</div><div><b>{roomOpen.role==="GUEST"?"You":roomOpen.status==="ACTIVE"?"Opponent":"Waiting..."}</b><span>{roomOpen.status==="ACTIVE"?"Live player":"Join to play"}</span></div></div>
            {roomOpen.role==="SPECTATOR" && <div className="live-pill">● LIVE · Spectating</div>}
          </div>}

          {roomOpen.type==="Game" && !roomOpen.roomId && <div className="live-lobby">
            <div><b>Choose a live room</b><span>{availableRooms.length?"Join an open room and play together.":"No open room yet — create the first one."}</span></div>
            <div className="room-choice-list">{availableRooms.slice(0,3).map((r:any)=><button key={r.id} className="room-choice" disabled={roomBusy} onClick={()=>joinGameRoom(r)}><span>● Open room · {String(r.id).slice(0,6)}</span><b>Join</b></button>)}</div>
            {!availableRooms.length && <button className="btn" disabled={roomBusy} onClick={()=>createGameRoom(roomOpen.name,roomOpen.icon,roomOpen.meta)}>{roomBusy?"Creating…":"Create live room"}</button>}
          </div>}

          {roomOpen.type==="Game" && roomOpen.roomId && roomOpen.status!=="ACTIVE" && roomOpen.role==="HOST" && <div className="waiting-stage">
            <div className="waiting-orbit"><span>1</span><span>2</span><span>3</span></div>
            <b>Waiting for another player</b><p>Keep this screen open. As soon as someone joins, the game stage will activate.</p>
            <div className="stage-actions"><button className="chip" onClick={()=>notify("Invite link can be shared from the game room.")}>Invite a player</button><button className="chip" onClick={()=>notify("Your room is live in the lounge.")}>Keep open</button></div>
          </div>}

          {roomOpen.type==="Game" && roomOpen.roomId && roomOpen.status==="ACTIVE" && <div className="game-stage-canvas">
            <div className="game-stage-top"><span className="live-pill">● LIVE</span><span>{roomOpen.role==="SPECTATOR"?"Watch & react":"Your turn / shared play"}</span><div className="stage-reactions"><button className="chip" onClick={()=>fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reaction",roomId:roomOpen.roomId,reaction:"👏 Cheer"})}).catch(()=>{})}>👏</button><button className="chip" onClick={()=>fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reaction",roomId:roomOpen.roomId,reaction:"❤️ Love"})}).catch(()=>{})}>❤️</button><button className="chip" onClick={()=>fetch("/api/game-rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reaction",roomId:roomOpen.roomId,reaction:"🔥 Fire"})}).catch(()=>{})}>🔥</button></div></div>
            {roomOpen.name==="Tic-Tac-Toe" && <div className="game-showcase"><div className="game-status">Turn: <b>{gameTurn==="X"?"Player X":"Player O"}</b></div><div className="tic-board showcase-board">{gameCells.map((v,i)=><button className="tic-cell" key={i} disabled={roomOpen.role==="SPECTATOR"} onClick={()=>playTic(i)}>{v}</button>)}</div><div className="game-hint">Tap a square to make your move. Both players see the board update.</div><button className="btn ghost" onClick={resetGame}>New game</button></div>}
            {roomOpen.name==="Ludo After Work" && <div className="ludo-real-stage">
              <div className="ludo-player-strip">{(roomOpen.players||[]).slice(0,4).map((p:any,i:number)=><div key={p.userId||i} className={"ludo-player "+(i===ludoTurn?"turn":"")}><span className="ludo-mini-avatar">{p.avatarUrl?<img src={p.avatarUrl} alt=""/>:p.initial||"P"}</span><span><b>{p.displayName||"Player "+(i+1)}</b><small>{i===ludoTurn?"TURN":i===0?"HOST":"PLAYER"}</small></span></div>)}</div>
              <div className="ludo-board-real">
                <svg viewBox="0 0 600 600" role="img" aria-label="Four player Ludo board">
                  <rect x="8" y="8" width="584" height="584" rx="34" fill="#fff" stroke="#ece7ea" strokeWidth="5"/>
                  <rect x="28" y="28" width="112" height="112" rx="22" fill="#fdecef"/><rect x="460" y="28" width="112" height="112" rx="22" fill="#edf3ff"/>
                  <rect x="28" y="460" width="112" height="112" rx="22" fill="#edf9f3"/><rect x="460" y="460" width="112" height="112" rx="22" fill="#f5efff"/>
                  {[0,1,2,3].map(pi=>[0,1,2,3].map(ti=>{const home=[[58,58],[108,58],[58,108],[108,108]][ti];const off=pi===0?[0,0]:pi===1?[402,0]:pi===2?[0,402]:[402,402];const xy=[home[0]+off[0],home[1]+off[1]];return <circle key={"h"+pi+ti} cx={xy[0]} cy={xy[1]} r="13" fill="#fff" stroke={LUDO_COLORS[pi]} strokeWidth="5"/>;}))}
                  {LUDO_TRACK.map(([x,y],i)=><circle key={"track"+i} cx={x} cy={y} r="9.5" fill={i%13===0?LUDO_COLORS[Math.floor(i/13)%4]:"#f7f5f6"} stroke="#ddd8dc" strokeWidth="1.5"/>}
                  {[0,1,2,3].map(pi=>Array.from({length:5},(_,k)=>{const start=[0,13,26,39][pi];const xy=LUDO_TRACK[(start+k)%52];const cx=300+(xy[0]-300)*((k+1)/6),cy=300+(xy[1]-300)*((k+1)/6);return <circle key={"lane"+pi+k} cx={cx} cy={cy} r="9" fill={LUDO_COLORS[pi]} opacity=".65"/>;}))}
                  <path d="M260 260L340 260L300 300Z" fill="#e95d72"/><path d="M340 260L340 340L300 300Z" fill="#5b82d8"/><path d="M340 340L260 340L300 300Z" fill="#55a67a"/><path d="M260 340L260 260L300 300Z" fill="#a57ad8"/>
                  {(roomOpen.players||[]).slice(0,4).flatMap((p:any,pi:number)=>(gameLudoPositions[pi]||[-1,-1,-1,-1]).map((progress:number,ti:number)=>{
                    let x=0,y=0;
                    if(progress<0){const homes=[[[58,58],[108,58],[58,108],[108,108]],[[518,58],[568,58],[518,108],[568,108]],[[58,518],[108,518],[58,568],[108,568]],[[518,518],[568,518],[518,568],[568,568]]];[x,y]=homes[pi][ti];}
                    else if(progress>=52){const xy=LUDO_TRACK[[0,13,26,39][pi]];const f2=(progress-51)/5;x=xy[0]+(300-xy[0])*Math.min(1,f2);y=xy[1]+(300-xy[1])*Math.min(1,f2);}
                    else {const xy=LUDO_TRACK[([0,13,26,39][pi]+progress)%52]||[300,300];x=xy[0];y=xy[1];}
                    const isTurn=pi===ludoTurn&&ludoPendingRoll>0;
                    return <g key={"token"+pi+"-"+ti} onClick={()=>isTurn&&moveLudoToken(ti)} style={{cursor:isTurn?"pointer":"default"}}><circle cx={x} cy={y} r="13" fill={LUDO_COLORS[pi]} stroke="#fff" strokeWidth="3"/><text x={x} y={y+4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{ti+1}</text></g>;
                  }))}
                </svg>
              </div>
              <div className="ludo-controls"><div className="ludo-dice"><span>LAST ROLL</span><strong>{gameDice||"—"}</strong></div><div className="ludo-turn-copy"><b>{ludoPendingRoll?"Player "+(ludoTurn+1)+": choose a token":"Player "+(ludoTurn+1)+"'s turn"}</b><small>{(roomOpen.players||[]).length}/4 players · Four tokens each · Roll → choose token</small></div><button className="btn" disabled={roomOpen.role==="SPECTATOR"||ludoPendingRoll>0||(roomOpen.players||[]).findIndex((x:any)=>String(x.userId)===String(user?.user?.id))!==ludoTurn} onClick={rollDice}>🎲 Roll Dice</button></div>
            </div>}
            {roomOpen.name==="Snake Sprint" && <div className="game-showcase"><div className="score-duo"><b>Your score {gameScore}</b><b>Opponent live</b></div><div className="snake-board">{Array.from({length:30},(_,i)=><button disabled={roomOpen.role==="SPECTATOR"} className={i===gameTarget?"snake-target":"snake-cell"} key={i} onClick={tapTarget}>{i===gameTarget?"●":""}</button>)}</div><button className="btn" disabled={roomOpen.role==="SPECTATOR"} onClick={tapTarget}>Catch the target</button></div>}
            {roomOpen.name==="Rapid Quiz" && <div className="game-showcase"><div className="game-status">Question {gameQuizIndex+1} of 5 · Score {gameQuizScore}</div><div className="question-stage"><small>YOUR QUESTION</small><h3>{quizQuestions[gameQuizIndex][0]}</h3><div className="answer-grid">{quizQuestions[gameQuizIndex][1].map((x,i)=><button className="answer-option" key={x} disabled={roomOpen.role==="SPECTATOR"} onClick={()=>{const score=gameQuizScore+(i===quizQuestions[gameQuizIndex][2]?1:0);setGameQuizScore(score);if(gameQuizIndex===4)notify("Quiz complete: "+score+"/5");else setGameQuizIndex(gameQuizIndex+1)}}><span>{String.fromCharCode(65+i)}</span>{x}</button>)}</div></div></div>}
            {roomOpen.name==="Memory Match" && <div className="game-showcase"><div className="game-status">Matched {memoryMatched.length/2}/{memoryCards.length/2} pairs</div><div className="memory-board">{memoryCards.map((v,i)=><button disabled={roomOpen.role==="SPECTATOR"} key={i} className="memory-card showcase-card" onClick={()=>flipMemory(i)}>{memoryMatched.includes(i)||memoryFlipped.includes(i)?v:"?"}</button>)}</div></div>}
            {roomOpen.name==="Chess Café" && <div className="game-showcase"><div className="chess-showcase-board">{Array.from({length:64},(_,i)=><button key={i} className={((Math.floor(i/8)+i)%2===0)?"chess-light":"chess-dark"}>{i===0?"♜":i===1?"♞":i===2?"♝":i===3?"♛":i===4?"♚":i===5?"♝":i===6?"♞":i===7?"♜":i>47&&i<56?"♙":""}</button>)}</div><div className="game-hint">Choose a piece and make your move. Opponent moves appear live.</div></div>}
            {premiumGameNames.has(roomOpen.name) && <div className="game-showcase"><div className="round-head"><span>ROUND {experienceRound}</span><b>{experienceScore} points</b></div><div className="question-stage"><small>LIVE CHALLENGE</small><h3>{gamePrompt||"Ready for the first challenge?"}</h3><p>Both players answer. Then Cuddl reveals how your choices compare.</p><div className="answer-grid"><button className="answer-option" disabled={roomOpen.role==="SPECTATOR"} onClick={startPremiumRound}>Start / next challenge</button><button className="answer-option" disabled={roomOpen.role==="SPECTATOR"} onClick={answerPremiumRound}>{experienceChoice?"Answered ✓":"I answered"}</button></div></div></div>}
            {(["Rapid Fire + Truth & Dare","Would You Rather","Two Truths & a Lie","Emoji Guess","Green Flag / Red Flag","5 Second Challenge","Guess the Song","Guess the Movie"].includes(roomOpen.name)) && <div className="game-showcase"><div className="question-stage"><small>YOUR TURN</small><h3>{gamePrompt||"Tap for your first prompt"}</h3><p>Answer here, then your partner gets the same turn.</p><div className="answer-grid"><button className="answer-option" disabled={roomOpen.role==="SPECTATOR"} onClick={nextPrompt}>Next prompt</button><button className="answer-option" disabled={roomOpen.role==="SPECTATOR"} onClick={()=>{setExperienceChoice("answered");notify("Answer submitted ✦")}}>{experienceChoice?"Submitted ✓":"Submit answer"}</button></div></div></div>}
          </div>}

          {roomOpen.type==="Activity" && <div className="activity-stage">
            <div className="activity-people"><div className="people-label">LIVE PARTICIPANTS</div><div className="people-stack"><span>SA</span><span>AN</span><span>RK</span><span>+</span></div><b>{roomOpen.role==="SPECTATOR"?"Watch the room":"You're in the activity"}</b></div>
            <div className="activity-hero"><div className="activity-icon-large">{roomOpen.icon}</div><small>SHARED ACTIVITY</small><h3>{roomOpen.name}</h3><p>{roomOpen.meta}</p></div>
            <div className="activity-prompt"><small>THE EXPERIENCE</small><h3>{gamePrompt||"Complete the challenge together."}</h3><p>Everyone gets a turn. Responses and reactions appear in the shared room.</p></div>
            <div className="stage-actions"><button className="btn" disabled={roomOpen.role==="SPECTATOR"||activityDone} onClick={()=>{setActivityDone(true);setGamePrompt(promptBank[roomOpen.name]?.[0]||"Tell your partner one thing you would love to do together.");notify("Your response is in ✦")}}>{activityDone?"Response submitted ✓":"Take my turn"}</button><button className="btn ghost" onClick={()=>notify("Reaction sent ❤️")}>❤️ React</button></div>
          </div>}

          {roomOpen.type==="Music" && <div className="activity-stage music-stage"><div className="music-art">{roomOpen.icon}</div><small>LIVE MUSIC ROOM</small><h3>{roomOpen.name}</h3><p>{roomOpen.meta}</p><div className="music-wave"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><button className="btn" onClick={()=>notify("Joined the music room ✦")}>Join the room</button></div>}

          {roomOpen.type==="Game" && roomOpen.roomId && roomOpen.status==="ACTIVE" && <div className="experience-footer"><span>👥 {roomOpen.role==="SPECTATOR"?"Watching live":"2 players connected"} · Reactions are visible to everyone</span><button className="chip" onClick={roomOpen.type==="Game"?closeGameRoom:()=>setRoomOpen(null)}>Leave</button></div>}
        </div>
      </div>}
      {verificationOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Two-level identity check</div><h2>{freeVerificationStatus==="reverify_required"?"Re-verification required":"Verify with your camera"}</h2>
        <p className="sub">{freeVerificationStatus==="reverify_required"?"Your live selfies did not match your current profile photo closely enough. Capture fresh selfies to retry.":"Cuddl first runs an AI face-match against your profile photo. If it passes, you can continue using Cuddl immediately with an AI Verified tag. Final manual verification is completed by the Cuddl team in the background."}</p>
        {freeVerificationStatus==="reverify_required" && <div className="panel"><div className="eyebrow">Admin requested information</div><p className="sub">{myVerification.reverificationRequest||"Please provide the information requested by the Cuddl verification team."}</p><textarea className="field" rows={4} value={verificationResponse} onChange={e=>setVerificationResponse(e.target.value)} placeholder="Enter the requested information..." /><button className="btn" disabled={verificationResponseBusy||!verificationResponse.trim()} onClick={async()=>{setVerificationResponseBusy(true);try{const r=await fetch("/api/verification/review-response",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({response:verificationResponse})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not submit response");notify("Information sent to the Cuddl verification team ✓");}catch(e){notify(e instanceof Error?e.message:"Could not submit response");}finally{setVerificationResponseBusy(false);}}}>{verificationResponseBusy?"Sending…":"Send information"}</button></div>}
        <div className="panel" style={{padding:12}}>
          <div className="camera-stage">
          <video ref={cameraVideoRef} autoPlay playsInline muted style={{width:"100%",borderRadius:16,background:"#111",display:cameraStream?"block":"none",transform:"scaleX(-1)"}} />
          {cameraStream && <div className="camera-guide-overlay"><div className={"face-shadow "+cameraAngle}><span></span></div><b>{cameraAngle==="front"?"Look straight at the guide":cameraAngle==="left"?"Turn slightly left":"Turn slightly right"}</b><small>Keep your face inside the box and match the black shadow.</small></div>}
          {!cameraStream&&<div className="camera-guide-preview"><div className={"face-shadow "+cameraAngle}><span></span></div><b>Next: {cameraAngle} selfie</b><small>Match the black shadow when the camera opens.</small></div>}
        </div>
          
          <canvas ref={cameraCanvasRef} style={{display:"none"}} />
          <div className="actions">{!cameraStream?<button className="btn" disabled={freeVerificationStatus==="ai_verified"||freeVerificationStatus==="verified"||cameraBusy||allFreeVerificationCaptured} onClick={()=>startFreeCamera(cameraAngle)}>{freeVerificationStatus==="reverify_required"?"Retry verification":allFreeVerificationCaptured?"All selfies captured ✓":cameraBusy?"Opening camera…":`Start ${cameraAngle} camera`}</button>:<button className="btn" onClick={captureFreeCamera} disabled={freeVerificationStatus==="ai_verified"||freeVerificationStatus==="verified"||allFreeVerificationCaptured}>Capture {cameraAngle}</button>}{cameraStream&&<button className="btn ghost" onClick={stopFreeCamera} disabled={freeVerificationStatus==="ai_verified"||freeVerificationStatus==="verified"||allFreeVerificationCaptured}>Stop camera</button>}</div>
        </div>
        <div className="verification-list">{(["front","left","right"] as const).map(k=><div className="safe" key={k}><b>{k==="front"?"Front":k==="left"?"Left":"Right"} selfie</b> · {freeVerificationFiles[k]?"✓ captured":"not captured"}</div>)}</div>
        <p className="safe">Camera access is permission-based and HTTPS-only; the camera stream is stopped after each capture.</p>
        <button className="btn" disabled={(freeVerificationStatus==="ai_verified"||freeVerificationStatus==="verified")||!allFreeVerificationCaptured||verificationSubmitting} onClick={submitFreeVerification}>{verificationSubmitting?"AI CHECKING…":"SUBMIT VERIFICATION"}</button>
        <div className="safe">Status: <b>{freeVerificationStatus==="ai_verified"?"AI Verified":freeVerificationStatus==="verified"?"Cuddl Verified":freeVerificationStatus==="reverify_required"?"Re-verification required":"Verification ready"}</b></div>
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
          <div className="profile-field-group"><label>Profile name</label><input className="field" placeholder="Enter your name" value={profileDraft.displayName} onChange={e=>setProfileDraft({...profileDraft,displayName:e.target.value})}/></div>
          <div className="profile-field-group"><label>City</label><input className="field" placeholder="Enter city" value={profileDraft.city} onChange={e=>setProfileDraft({...profileDraft,city:e.target.value})} required /></div>
          <div className="profile-field-group"><label>About you</label><textarea className="field profile-textarea" placeholder="Tell people something real about you" value={profileDraft.bio} onChange={e=>setProfileDraft({...profileDraft,bio:e.target.value})} minLength={10} required /></div>
          <div className="profile-location-card"><div><div className="eyebrow">Discovery location</div><b>📍 Current location</b><p className="safe">Used for nearby-distance matching. Your exact coordinates are never shown to other members.</p></div><button type="button" className="btn ghost" onClick={useCurrentLocationForProfile} disabled={locationBusy}>{profileDraft.locationGranted?"Update current location":"Use current location"}</button>{profileDraft.locationGranted&&<span className="location-status">✓ Location captured — save profile to apply</span>}</div>
          <div className="profile-extended-grid">
            <div className="profile-field-group"><label>State</label><select className="field" value={profileDraft.state||""} onChange={e=>setProfileDraft({...profileDraft,state:e.target.value})}><option value="">Select state</option>{profileStates.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Marital status</label><select className="field" value={profileDraft.maritalStatus||""} onChange={e=>setProfileDraft({...profileDraft,maritalStatus:e.target.value})}><option value="">Select marital status</option><option value="SINGLE">Single</option><option value="DIVORCED">Divorced</option><option value="WIDOWED">Widowed</option><option value="SEPARATED">Separated</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></div>
            <div className="profile-field-group"><label>Food preference</label><input className="field" placeholder="Food preference" value={profileDraft.foodPreference||""} onChange={e=>setProfileDraft({...profileDraft,foodPreference:e.target.value})}/></div>
            <div className="profile-field-group"><label>Company</label><input className="field" placeholder="Company name" value={profileDraft.company||""} onChange={e=>setProfileDraft({...profileDraft,company:e.target.value})}/></div>
            <div className="profile-field-group"><label>Profession</label><select className="field" value={profileDraft.profession||""} onChange={e=>setProfileDraft({...profileDraft,profession:e.target.value})}><option value="">Select profession</option>{profileProfessions.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Religion</label><select className="field" value={profileDraft.religion||""} onChange={e=>setProfileDraft({...profileDraft,religion:e.target.value})}><option value="">Select religion</option>{profileReligions.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Community</label><select className="field" value={profileDraft.community||""} onChange={e=>setProfileDraft({...profileDraft,community:e.target.value})}><option value="">Select community</option>{profileCommunities.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Diet</label><select className="field" value={profileDraft.diet||""} onChange={e=>setProfileDraft({...profileDraft,diet:e.target.value})}><option value="">Select diet</option><option>Vegetarian</option><option>Vegan</option><option>Eggetarian</option><option>Jain</option><option>Non-vegetarian</option><option>Anything</option></select></div>
            <div className="profile-field-group"><label>Smoking</label><select className="field" value={profileDraft.smoking||""} onChange={e=>setProfileDraft({...profileDraft,smoking:e.target.value})}><option value="">Select smoking preference</option><option>Never</option><option>Occasionally</option><option>Regularly</option><option>Prefer not to say</option></select></div>
            <div className="profile-field-group"><label>Drinking</label><select className="field" value={profileDraft.drinking||""} onChange={e=>setProfileDraft({...profileDraft,drinking:e.target.value})}><option value="">Select drinking preference</option><option>Never</option><option>Occasionally</option><option>Socially</option><option>Regularly</option><option>Prefer not to say</option></select></div>
            <div className="profile-field-group"><label>Relationship goal</label><select className="field" value={profileDraft.relationshipGoal||""} onChange={e=>setProfileDraft({...profileDraft,relationshipGoal:e.target.value})}><option value="">Select goal</option>{profileRelationshipGoals.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Education</label><select className="field" value={profileDraft.education||""} onChange={e=>setProfileDraft({...profileDraft,education:e.target.value})}><option value="">Select education level</option>{profileQualifications.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Children preference</label><select className="field" value={profileDraft.children||""} onChange={e=>setProfileDraft({...profileDraft,children:e.target.value})}><option value="">Select preference</option>{profileChildren.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Pets preference</label><select className="field" value={profileDraft.pets||""} onChange={e=>setProfileDraft({...profileDraft,pets:e.target.value})}><option value="">Select preference</option>{profilePets.map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="profile-field-group"><label>Exercise</label><select className="field" value={profileDraft.exercise||""} onChange={e=>setProfileDraft({...profileDraft,exercise:e.target.value})}><option value="">Select exercise</option><option>Daily</option><option>Often</option><option>Sometimes</option><option>Rarely</option></select></div>
            <div className="profile-field-group"><label>Languages</label>
  <div className="language-picker">
    <div className="language-selected">{(profileDraft.languages||[]).length ? (profileDraft.languages||[]).join(", ") : "Select one or more languages"}</div>
    <div className="language-options">
      {profileLanguages.map(x=>{const selected=(profileDraft.languages||[]).includes(x);return <label className={"language-option "+(selected?"selected":"")} key={x}>
        <input type="checkbox" checked={selected} onChange={()=>setProfileDraft((d:any)=>{const current=Array.isArray(d.languages)?d.languages:[];const next=selected?current.filter((v:string)=>v!==x):[...current,x];return {...d,languages:next,language:next[0]||""};})}/>
        <span>{x}</span>
      </label>})}
    </div>
  </div>
</div>
            <div className="profile-field-group"><label>Height</label><select className="field" value={profileDraft.heightCm||""} onChange={e=>setProfileDraft({...profileDraft,heightCm:e.target.value})}><option value="">Select height</option>{profileHeights.map(x=><option key={x} value={x}>{x} cm</option>)}</select></div>
            <div className="profile-field-group"><label>Gender</label><select className="field" value={profileDraft.gender} onChange={e=>setProfileDraft({...profileDraft,gender:e.target.value})}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option></select></div>
            <div className="profile-field-group"><label>Who you want to meet</label><select className="field" value={profileDraft.desiredGender} onChange={e=>setProfileDraft({...profileDraft,desiredGender:e.target.value})}><option value="FEMALE">Women</option><option value="MALE">Men</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option><option value="ANY">Everyone</option></select></div>
          </div>
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
              {Array.isArray(media)&&media.length>0&&<div className="media-thumb-grid">{media.map((m:any,j:number)=>{const src=m.pathname?"/api/profile/media?pathname="+encodeURIComponent(m.pathname):"";return <div className="media-thumb-card" key={m.pathname||j}>{m.kind==="photo"&&src?<img src={src} alt=""/>:m.kind==="video"&&src?<video muted playsInline preload="metadata" src={src}/>:<div className="media-thumb-icon">{m.kind==="voice"?"🎙️":"•"}</div>}<button type="button" className="media-thumb-remove" aria-label="Remove media" onClick={()=>setItem({media:media.filter((_:any,k:number)=>k!==j)})}>×</button></div>})}</div>}
            </div>
          })}
          <div className="filter-section-title">🎨 Profile-wide Personality Showcase</div>
          <p className="safe">Optional media that represents your overall vibe. Prompt media above stays attached to its specific answer.</p>
          <div className="showcase-upload-grid">
            <label className="showcase-upload"><span>📸</span><b>Add profile photo</b><small>Show a moment that feels like you</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>handleShowcaseFile(e,"photo")} /></label>
            <button type="button" className="showcase-upload" onClick={()=>showcaseRecording==="voice"?stopShowcaseRecording():startShowcaseRecording("voice")} disabled={showcaseBusy}><span>🎙️</span><b>{showcaseRecording==="voice"?"Stop voice":"Record voice"}</b><small>Up to 20 seconds</small></button>
            <button type="button" className="showcase-upload" onClick={()=>showcaseRecording==="video"?stopShowcaseRecording():startShowcaseRecording("video")} disabled={showcaseBusy}><span>🎥</span><b>{showcaseRecording==="video"?"Stop video":"Record video"}</b><small>Up to 15 seconds</small></button>
          </div>
          {Array.isArray(profileDraft.profileShowcase)&&profileDraft.profileShowcase.length>0&&<div className="media-thumb-grid showcase-media-grid">
            {profileDraft.profileShowcase.map((x:any,i:number)=>{
              const src=x.pathname?"/api/profile/media?pathname="+encodeURIComponent(x.pathname):"";
              return <div className="media-thumb-card" key={x.pathname||i}>
                {x.kind==="photo"&&src?<img src={src} alt=""/>:x.kind==="video"&&src?<video muted playsInline preload="metadata" src={src}/>:x.kind==="voice"&&src?<div className="media-thumb-icon">🎙️</div>:<div className="media-thumb-icon">•</div>}
                <button type="button" className="media-thumb-remove" aria-label="Remove media" onClick={()=>setProfileDraft((d:any)=>({...d,profileShowcase:(d.profileShowcase||[]).filter((_:any,j:number)=>j!==i)}))}>×</button>
              </div>
            })}
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
              {Array.isArray(media)&&media.length>0&&<div className="media-thumb-grid">{media.map((m:any,j:number)=>{const src=m.pathname?"/api/profile/media?pathname="+encodeURIComponent(m.pathname):"";return <div className="media-thumb-card" key={m.pathname||j}>{m.kind==="photo"&&src?<img src={src} alt=""/>:m.kind==="video"&&src?<video muted playsInline preload="metadata" src={src}/>:<div className="media-thumb-icon">{m.kind==="voice"?"🎙️":"•"}</div>}<button type="button" className="media-thumb-remove" aria-label="Remove media" onClick={()=>setItem({media:media.filter((_:any,k:number)=>k!==j)})}>×</button></div>})}</div>}
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
        <div className="panel"><b>Ready to explore</b><p className="sub">Open this Cuddl experience and continue from here. The current build keeps the interaction lightweight while the full dedicated flow is expanded.</p></div>
        <button className="btn" onClick={()=>{setProfileModal(null);setTab(activeFeature.title==="Serendipity Mode"?"discover":"lounge");notify(activeFeature.title+" opened ✦")}}>Explore</button>
        <button className="btn ghost" onClick={()=>setProfileModal(null)}>Close</button>
      </div></div>}
      {forgotOpen && <div className="overlay popup-overlay"><div className="login-popup">
        <div className="eyebrow">Account access</div><h2>Forgot password?</h2>
        <p className="sub">Enter your registered email. Password reset email delivery is not connected in this test build, so no reset request is sent from this screen.</p>
        <input className="field" type="email" autoComplete="email" placeholder="you@example.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}/>
        <button className="btn" onClick={()=>{setForgotOpen(false);notify(forgotEmail.trim()?"Reset email flow is pending email setup":"Enter your registered email")}}>Continue</button>
        <button className="btn ghost" onClick={()=>setForgotOpen(false)}>Close</button>
      </div></div>}
      {profileOnboarding && onboardingChecked && onboardingPromptOpen && <div className="overlay popup-overlay onboarding-lock"><div className="login-popup profile-modal">
        <div className="eyebrow">Required before Discover</div><h2>Complete your profile first.</h2>
        <p className="sub">Complete your basic profile details first. Identity verification will then be mandatory before you can browse or use Cuddl.</p>
        <div className="verification-list"><div>✓ Profile name</div><div>✓ City & state</div><div>✓ Gender & discovery preference</div><div>✓ Short bio (minimum 10 characters)</div><div>✓ Marital status</div></div>
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
        {nav.filter(([id])=>id!=="profile").map(([id,icon,label]) => <button key={id} className={tab===id ? "active" : ""} onClick={() => {if(profileOnboarding && id!=="profile"){setProfileModal("edit");notify("Complete your profile before browsing");return;} if(!profileOnboarding && !["ai_verified","verified","ai_pending"].includes(freeVerificationStatus) && id!=="profile"){setVerificationOpen(true);notify("Complete the AI identity check before continuing");return;} setTab(id);}}><span className="nav-icon"><AppIcon name={icon}/></span><span className="nav-label">{label}</span></button>)}
      </nav>
      {toast && <div role="status" style={{position:"fixed",left:"50%",bottom:84,transform:"translateX(-50%)",background:"#282326",color:"#fff",borderRadius:99,padding:"11px 15px",fontSize:12,zIndex:80}}>{toast}</div>}
    </div>
  );
}