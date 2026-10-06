"use client";

import { useEffect, useState } from "react";

type MediaItem={id:string;kind:"photo"|"video";pathname:string};

export default function ProfilePreviewPage(){
  const [loading,setLoading]=useState(true);
  const [profile,setProfile]=useState<any>(null);
  const [media,setMedia]=useState<MediaItem[]>([]);
  const [index,setIndex]=useState(0);
  const [error,setError]=useState("");

  useEffect(()=>{
    (async()=>{
      try{
        const r=await fetch("/api/me",{cache:"no-store"});
        const d=await r.json();
        if(!d.authenticated){window.location.href="/";return;}
        setProfile(d.profile);
        const mr=await fetch("/api/profile/media/list",{cache:"no-store"});
        const md=await mr.json();
        if(Array.isArray(md.media)) setMedia(md.media.map((x:any)=>({id:String(x.id),kind:x.type==="video"?"video":"photo",pathname:String(x.storageKey||"")})).filter((x:MediaItem)=>x.pathname));
      }catch{setError("Could not load your profile preview.");}
      finally{setLoading(false);}
    })();
  },[]);

  if(loading)return <main className="visitor-preview-page"><div className="visitor-preview-top"><h1>Profile preview</h1></div><div className="visitor-profile-body"><p className="sub">Loading your profile…</p></div></main>;
  if(error||!profile)return <main className="visitor-preview-page"><div className="visitor-preview-top"><h1>Profile preview</h1><button className="visitor-preview-back" onClick={()=>window.location.href="/"}>Back</button></div><div className="visitor-profile-body"><p>{error||"Profile not available."}</p></div></main>;

  const lp=profile.lifestylePreferences||{};
  const prompts=[...(Array.isArray(lp.personalityPrompts)?lp.personalityPrompts:[]),...(Array.isArray(lp.partnerPrompts)?lp.partnerPrompts:[])].filter((x:any)=>x?.question||x?.answer);
  const current=media[index];
  const src=current?"/api/profile/media?pathname="+encodeURIComponent(current.pathname):"";
  const age=profile.dateOfBirth?Math.max(0,new Date().getFullYear()-new Date(profile.dateOfBirth).getFullYear()):null;
  const facts=[
    ["Work",[lp.profession,lp.company].filter(Boolean).join(" · ")],
    ["Education",lp.education],
    ["Relationship",lp.relationshipGoal],
    ["Lifestyle",[lp.foodPreference||lp.food,lp.diet,lp.smoking,lp.drinking].filter(Boolean).join(" · ")],
    ["Family & pets",[lp.children,lp.pets].filter(Boolean).join(" · ")],
    ["Background",[lp.religion,lp.community].filter(Boolean).join(" · ")]
  ].filter(x=>x[1]);

  return <main className="visitor-preview-page">
    <div className="visitor-preview-shell">
      <header className="visitor-preview-top">
        <h1>How others see you</h1>
        <button className="visitor-preview-back" onClick={()=>window.location.href="/"}>← Back to Cuddl</button>
      </header>

      <section>
        <div className="visitor-profile-photo">
          {current ? (current.kind==="video" ? <video src={src} controls playsInline preload="metadata"/> : <img src={src} alt={profile.displayName||"Profile"}/>) :
            <div className="profile-tinder-empty"><span className="top-profile-avatar large">{String(profile.displayName||"Y").slice(0,1).toUpperCase()}</span><div><b>Add a profile photo</b><small>Your main photo will appear here.</small></div></div>}
          {media.length>1&&<><button className="photo-arrow left" onClick={()=>setIndex(i=>(i-1+media.length)%media.length)} aria-label="Previous photo">‹</button><button className="photo-arrow right" onClick={()=>setIndex(i=>(i+1)%media.length)} aria-label="Next photo">›</button><span className="photo-count">{index+1}/{media.length}</span></>}
        </div>

        <div className="visitor-profile-body">
          <div className="trust-badges">
            {profile.verification?.adminVerificationStatus==="verified"&&<span className="trust-badge">✓ Cuddl Verified</span>}
            {profile.verification?.photoVerified&&<span className="trust-badge">✓ Photo Verified</span>}
            {profile.verification?.phoneVerified&&<span className="trust-badge">✓ Phone Verified</span>}
            {profile.verification?.emailVerified&&<span className="trust-badge">✓ Email Verified</span>}
            {profile.verification?.aiAutoVerified&&profile.verification?.adminVerificationStatus!=="verified"&&<span className="trust-badge ai">✓ AI Verified</span>}
          </div>
          <h2 className="visitor-profile-name">{profile.displayName}{age ? ", "+age:""} ✓</h2>
          <div className="visitor-profile-location">⌖ {profile.city||"Location hidden"} · Active now</div>
          {profile.bio&&<p className="visitor-profile-bio">{profile.bio}</p>}

          {prompts.length>0&&<section className="visitor-section">
            <h2>Get to know me</h2>
            {prompts.map((x:any,i:number)=><div className="prompt-card" key={i}><small>{i < (lp.personalityPrompts||[]).length ? "ABOUT ME":"WHAT I VALUE IN A PARTNER"}</small><b>{x.question}</b><span>{x.answer}</span></div>)}
          </section>}

          {facts.length>0&&<section className="visitor-section">
            <h2>About me</h2>
            <div className="visitor-facts">{facts.map(([label,value])=><div className="visitor-fact" key={String(label)}><b>{label}</b><span>{String(value)}</span></div>)}</div>
          </section>}

          {Array.isArray(lp.personalityStickers)&&lp.personalityStickers.length>0&&<section className="visitor-section"><h2>My vibe</h2><div className="profile-tags">{lp.personalityStickers.map((x:string)=><span className="tag" key={x}>{x}</span>)}</div></section>}

          <div className="visitor-actions"><button className="pass" onClick={()=>window.history.back()}>Pass</button><button className="spark" onClick={()=>alert("Preview mode — sparks are sent from Discover.")}>♥ Send Spark</button></div>
        </div>
      </section>
    </div>
  </main>;
}
