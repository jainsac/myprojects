"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [authForm, setAuthForm] = useState({displayName:"",email:"",password:"",city:"Delhi"});
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [chatMatch, setChatMatch] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  useEffect(() => { fetch("/api/me").then(r=>r.json()).then(d=>{if(d.authenticated)setUser(d);}).finally(()=>setAuthChecked(true)); }, []);
  useEffect(() => { if(!user)return; fetch("/api/discover").then(r=>r.json()).then(d=>{if(Array.isArray(d.profiles))setDiscoverProfiles(d.profiles);}); fetch("/api/matches").then(r=>r.json()).then(d=>{if(Array.isArray(d.matches))setMatches(d.matches);}); }, [user]);
  async function submitAuth(e: React.FormEvent) { e.preventDefault(); setAuthBusy(true); setAuthError(""); const endpoint=authMode==="login"?"/api/auth/login":"/api/auth/register"; const payload=authMode==="login"?{email:authForm.email,password:authForm.password}:authForm; try { const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Authentication failed"); setUser(await fetch("/api/me").then(x=>x.json())); } catch(err){setAuthError(err instanceof Error?err.message:"Authentication failed");} finally{setAuthBusy(false);} }
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});setUser(null);setChatMatch(null);notify("Signed out");}
  async function openChat(match:any){
    if(!match?.matchId && !match?.id) return;
    const matchId=match.matchId||match.id;
    setChatMatch({...match,matchId});
    setChatMessages([]);
    try {
      const r=await fetch("/api/messages?matchId="+encodeURIComponent(matchId));
      const d=await r.json();
      if(r.ok) setChatMessages(Array.isArray(d.messages)?d.messages:[]);
      else notify(d.error||"Could not load chat");
    } catch { notify("Could not load chat"); }
  }
  async function sendMessage(e?:React.FormEvent){
    e?.preventDefault();
    const text=chatText.trim();
    if(!text || !chatMatch?.matchId || chatBusy) return;
    setChatBusy(true);
    try {
      const r=await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({matchId:chatMatch.matchId,body:text})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Could not send message");
      setChatMessages(current=>[...current,d.message]);
      setChatText("");
    } catch(err) { notify(err instanceof Error?err.message:"Could not send message"); }
    finally { setChatBusy(false); }
  }
  const person = useMemo(() => discoverProfiles.length ? discoverProfiles[index % discoverProfiles.length] : people[index % people.length], [index, discoverProfiles]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1700);
  }

  function spark() {
    setLiked((current) => current.some((p) => p.name === person.name) ? current : [...current, person]);
    setIndex((current) => current + 1);
    notify("Spark sent 💗");
  }

  const nav = [["discover","♡","Discover"],["lounge","🎮","Lounge"],["matches","◌","Matches"],["dates","✦","Dates"],["profile","☺","Profile"]] as const;

  if (!authChecked) return <div className="cuddl-app"><main className="content"><div className="panel"><b>Loading Cuddl…</b><p className="sub">Checking your secure session.</p></div></main></div>;
  if (!user) return <div className="cuddl-app"><main className="content auth-screen"><div className="brand auth-brand">Cuddl</div><div className="eyebrow">Activity-first social dating</div><h1 className="hero-title">{authMode==="login"?"Welcome back.":"Create your Cuddl account."}</h1><p className="sub">Meet through activities, games, music and real conversations.</p><form className="panel auth-form" onSubmit={submitAuth}>{authMode==="register" && <input className="field" placeholder="Your name" value={authForm.displayName} onChange={e=>setAuthForm({...authForm,displayName:e.target.value})} required />}<input className="field" type="email" placeholder="Email address" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} required /><input className="field" type="password" minLength={8} placeholder="Password (8+ characters)" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} required />{authMode==="register" && <input className="field" placeholder="City" value={authForm.city} onChange={e=>setAuthForm({...authForm,city:e.target.value})} />}{authError && <div className="auth-error">{authError}</div>}<button className="btn" disabled={authBusy}>{authBusy?"Please wait…":authMode==="login"?"Sign in":"Create account"}</button></form><button className="btn ghost auth-switch" onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setAuthError("");}}>{authMode==="login"?"New to Cuddl? Create an account":"Already have an account? Sign in"}</button></main></div>;

  return (
    <div className="cuddl-app">
      <header className="topbar">
        <div className="brand">Cuddl</div>
        <button className="icon-btn" aria-label="Safety Center" onClick={() => notify("Safety Center ready")}>♡</button>
      </header>

      <main className="content">
        {tab === "discover" && <>
          <div className="eyebrow">Dating, but more alive</div>
          <h1 className="hero-title">Meet through moments, not just swipes.</h1>
          <p className="sub">Discover people, then play, listen, explore and let chemistry happen naturally.</p>

          <section className="panel">
            <div className="eyebrow">Daily Spark</div>
            <div className="profile-row">
              <div className="avatar">{person.initial}</div>
              <div className="grow"><b>{person.displayName ?? person.name}{person.age ? `, ${person.age}` : ""} ✓</b><div className="sub">⌖ {person.city} · Active today</div><div>{(person.tags ?? []).map((t:string) => <span className="tag" key={t}>{t}</span>)}</div></div>
              <span className="score">{person.score}%</span>
            </div>
            <p className="sub">{person.bio || "Looking for someone kind, curious and ready for real conversations."}</p>
            <div className="actions">
              <button className="btn ghost" onClick={() => { setIndex(i => i + 1); notify("Passed — suggestions tuned"); }}>Pass</button>
              <button className="btn" onClick={spark}>♥ Send Spark</button>
            </div>
          </section>

          <section className="panel">
            <div className="eyebrow">Explore Together</div>
            <h2 style={{margin:"6px 0 4px"}}>Shared interests become activities.</h2>
            <p className="sub">Music + travel → road-trip playlist. Food + photography → street-food photo hunt. Trekking + nature → weekend trail.</p>
          </section>

          <div className="grid">
            {[
              ["🎮","Play Together","Ludo, Chess, Snake, quizzes and more."],
              ["🎵","Music Together","Karaoke, duets, open mic and listening rooms."],
              ["🎲","Social Roulette","Meet compatible people through a short activity."],
              ["💌","Chemistry Capsule","Answer privately and reveal together."],
            ].map(([icon,title,copy]) => <button className="card" key={title} onClick={() => {setTab("lounge");notify(title + " opened");}}><b>{icon} {title}</b><span>{copy}</span></button>)}
          </div>
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
            <div className="profile-row"><button className="icon-btn" onClick={()=>setChatMatch(null)} aria-label="Close chat">‹</button><div className="avatar">{chatMatch.initial}</div><div className="grow"><b>{chatMatch.name}</b><div className="sub">Matched on Cuddl · private chat</div></div></div>
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
          <div className="panel"><div className="profile-row"><div className="avatar">S</div><div><b>Your profile</b><div className="sub">82% complete · Add voice intro</div></div></div><div className="actions"><button className="btn" onClick={() => notify("Profile editor opened")}>Edit profile</button><button className="btn ghost" onClick={() => notify("Verification flow started")}>Verify</button><button className="btn ghost" onClick={logout}>Sign out</button></div></div>
          <div className="panel"><b>Privacy controls</b><p className="safe">Incognito · block contacts · private albums · activity visibility. Native mobile builds can use platform screenshot protections; browsers cannot guarantee screenshot prevention.</p><button className="btn ghost" onClick={() => notify("Privacy controls opened")}>Manage privacy</button></div>
          <div className="grid">
            {[
              ["🧭","Relationship Compass","Compare goals, communication and lifestyle preferences."],
              ["🙈","Blind Vibe","Interact before photos are fully revealed."],
              ["🧠","Memory Match","Save facts from conversations without inventing them."],
              ["🛂","Connection Passport","Private timeline of shared Cuddl moments."],
              ["🌡️","Connection Health","Interaction signals, not relationship certainty."],
              ["✨","Serendipity Mode","One surprise discovery outside your usual filters."],
            ].map(([icon,title,copy]) => <div className="card" key={title}><b>{icon} {title}</b><span>{copy}</span></div>)}
          </div>
        </>}
      </main>

      <nav className="nav" aria-label="Primary">
        {nav.map(([id,icon,label]) => <button key={id} className={tab===id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}
      </nav>
      {toast && <div role="status" style={{position:"fixed",left:"50%",bottom:84,transform:"translateX(-50%)",background:"#282326",color:"#fff",borderRadius:99,padding:"11px 15px",fontSize:12,zIndex:80}}>{toast}</div>}
    </div>
  );
}
