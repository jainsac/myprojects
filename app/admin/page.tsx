"use client";
import { useEffect, useState } from "react";

export default function AdminPage(){
  const [festival,setFestival]=useState<any[]>([]);
  const [activities,setActivities]=useState<any[]>([]);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [verifications,setVerifications]=useState<any[]>([]);
  const [refSettings,setRefSettings]=useState<any>({enabled:true,rewardType:"PLAN_EXTENSION",rewardValue:{months:1},qualificationEvent:"PROFILE_COMPLETE",maxRewardsPerUser:20});
  const [offers,setOffers]=useState<any[]>([]);
  const [offerForm,setOfferForm]=useState<any>({code:"",enabled:true,discountType:"PERCENT",discountValue:"10",rewardType:"DISCOUNT",rewardValue:{},applicablePlans:["Plus","Pro","Premium"],maxRedemptions:"",perUserLimit:"1",minPurchase:"0",startsAt:"",endsAt:""});
  const [planConfig,setPlanConfig]=useState<any>(null);
  const [error,setError]=useState("");
  const [festivalForm,setFestivalForm]=useState({name:"",slug:"",tagline:"",description:"",city:"Delhi",coverEmoji:"🎉"});
  const [activityForm,setActivityForm]=useState({activityName:"",category:"Festival",description:"",city:"Delhi",capacity:""});
  const [noteForm,setNoteForm]=useState({title:"",body:"",audience:"all",city:"Delhi",showPopup:true,publishNow:true});

  async function load(){
    const [f,n,v,o,p]=await Promise.all([fetch("/api/admin/festival"),fetch("/api/admin/notifications"),fetch("/api/admin/verification"),fetch("/api/offers"),fetch("/api/plan-config")]);
    const fd=await f.json(), nd=await n.json(), vd=await v.json(), od=await o.json(), pd=await p.json();
    if(!f.ok||!n.ok||!v.ok){setError(fd.error||nd.error||vd.error||"Admin access required.");return;}
    setFestival(fd.festivals||[]);setActivities(fd.activities||[]);setNotifications(nd.notifications||[]);setVerifications(vd.verifications||[]);setOffers(od.offers||[]);if(p.ok)setPlanConfig(pd);
  }
  useEffect(()=>{load()},[]);

  async function saveReferralSettings(e:React.FormEvent){e.preventDefault();const r=await fetch("/api/referral",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"settings",...refSettings})});const d=await r.json();if(!r.ok){setError(d.error||"Could not save referral settings");return;}load();}
  async function savePlanConfig(){const r=await fetch("/api/plan-config",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({config:planConfig})});const d=await r.json();if(!r.ok){setError(d.error||"Could not save plan configuration");return;}setPlanConfig(d.config);setError("");}
  async function saveOffer(e:React.FormEvent){e.preventDefault();const r=await fetch("/api/offers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(offerForm)});const d=await r.json();if(!r.ok){setError(d.error||"Could not save offer");return;}setOfferForm({...offerForm,code:""});load();}
  async function createFestival(e:React.FormEvent){
    e.preventDefault();setError("");
    const ids=activities.map(a=>a.id);
    const r=await fetch("/api/admin/festival",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...festivalForm,activityIds:ids})});
    const d=await r.json(); if(!r.ok){setError(d.error||"Could not create festival");return;} setFestivalForm({name:"",slug:"",tagline:"",description:"",city:"Delhi",coverEmoji:"🎉"});load();
  }
  async function createActivity(e:React.FormEvent){
    e.preventDefault();setError("");
    const r=await fetch("/api/admin/festival",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(activityForm)});
    const d=await r.json(); if(!r.ok){setError(d.error||"Could not create activity");return;} setActivityForm({activityName:"",category:"Festival",description:"",city:"Delhi",capacity:""});load();
  }
  async function toggleFestival(id:string){await fetch("/api/admin/festival",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action:"toggle"})});load();}
  async function publishNotification(e:React.FormEvent){
    e.preventDefault();setError("");
    const r=await fetch("/api/admin/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(noteForm)});
    const d=await r.json();if(!r.ok){setError(d.error||"Could not publish");return;}
    setNoteForm({title:"",body:"",audience:"all",city:"Delhi",showPopup:true,publishNow:true});load();
  }
  async function decideVerification(userId:string,action:string){ const r=await fetch("/api/admin/verification",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,action})}); const d=await r.json(); if(!r.ok){setError(d.error||"Could not update verification");return;} load(); }
  async function toggleNotification(id:string,isActive:boolean){
    await fetch("/api/admin/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,isActive:!isActive})});load();
  }
  if(error && !festival.length && !notifications.length) return <main className="admin-page"><div className="panel"><h1>Admin Console</h1><p className="auth-error">{error}</p><p className="sub">Set CUDDL_ADMIN_EMAILS in Vercel to the admin email, then sign in again.</p></div></main>;

  return <main className="admin-page">
    <div className="admin-head"><div><div className="eyebrow">Cuddl control room</div><h1>Admin Console</h1><p className="sub">Turn special experiences on for a limited occasion, then switch them off completely.</p></div><a className="btn ghost" href="/">Open app</a></div>
    {error&&<div className="auth-error">{error}</div>}
    {planConfig&&<section className="panel">
      <div className="eyebrow">Monetisation control</div><h2>Plans, pricing & feature assignment</h2>
      <p className="sub">This matrix is the source of truth. Tick a plan to make a feature part of that plan. Changes affect the Plans page and server-side feature gates without editing code.</p>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr><th style={{textAlign:"left",padding:"8px"}}>Feature</th>{["Basic","Plus","Pro","Premium"].map((p:string)=><th key={p} style={{padding:"8px"}}>{p}</th>)}</tr></thead>
          <tbody>{planConfig.features.map((f:any,i:number)=><tr key={f.key}>
            <td style={{padding:"8px",borderTop:"1px solid rgba(0,0,0,.08)"}}><b>{f.name}</b><div className="sub">{f.description}</div></td>
            {["Basic","Plus","Pro","Premium"].map((p:string)=><td key={p} style={{textAlign:"center",borderTop:"1px solid rgba(0,0,0,.08)"}}><input type="checkbox" checked={f.plans.includes(p)} onChange={()=>setPlanConfig((x:any)=>({...x,features:x.features.map((z:any,j:number)=>j===i?{...z,plans:z.plans.includes(p)?z.plans.filter((q:string)=>q!==p):[...z.plans,p]}:z)}))}/></td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <h3 style={{marginTop:22}}>Pricing</h3>
      {["Basic","Plus","Pro","Premium"].map((p:string)=><div className="admin-row" key={p}>
        <div><b>{p}</b><div className="sub">Edit any billing period. Set ₹0 for a free period.</div></div>
        <div className="admin-grid" style={{flex:1}}>
          {["Monthly","Quarterly","Half-year","Annual"].map((period:string)=><input key={period} className="field" placeholder={period} value={planConfig.plans[p].prices[period]??""} onChange={e=>setPlanConfig((x:any)=>({...x,plans:{...x.plans,[p]:{...x.plans[p],prices:{...x.plans[p].prices,[period]:Number(e.target.value)||0}}}}))}/>)}
        </div>
      </div>)}
      <button className="btn" onClick={savePlanConfig}>Save plan & feature settings</button>
    </section>}
    <section className="panel"><div className="eyebrow">Growth & rewards</div><h2>Referral program</h2>
      <p className="sub">Define the qualifying event and reward. Rewards are recorded in a ledger for later entitlement/payment integration.</p>
      <form className="admin-form" onSubmit={saveReferralSettings}>
        <label className="check"><input type="checkbox" checked={!!refSettings.enabled} onChange={e=>setRefSettings({...refSettings,enabled:e.target.checked})}/> Referral program enabled</label>
        <div className="admin-grid"><select className="field" value={refSettings.rewardType} onChange={e=>setRefSettings({...refSettings,rewardType:e.target.value})}><option value="PLAN_EXTENSION">Plan extension</option><option value="PLAN_UPGRADE">Plan upgrade</option><option value="MONETARY">Monetary reward</option><option value="BOOST">Boost credits</option><option value="SUPER_SPARK">Super Spark credits</option></select><select className="field" value={refSettings.qualificationEvent} onChange={e=>setRefSettings({...refSettings,qualificationEvent:e.target.value})}><option value="SIGNUP">Signup</option><option value="PROFILE_COMPLETE">Profile complete</option><option value="IDENTITY_VERIFIED">Identity verified</option><option value="PAID_PURCHASE">Paid purchase</option></select></div>
        <input className="field" placeholder='Reward value JSON, e.g. {"months":1,"plan":"Plus"}' value={JSON.stringify(refSettings.rewardValue)} onChange={e=>{try{setRefSettings({...refSettings,rewardValue:JSON.parse(e.target.value)})}catch{}}}/>
        <input className="field" inputMode="numeric" placeholder="Maximum referral rewards per user" value={refSettings.maxRewardsPerUser} onChange={e=>setRefSettings({...refSettings,maxRewardsPerUser:e.target.value})}/>
        <button className="btn">Save referral rules</button>
      </form>
    </section>
    <section className="panel"><div className="eyebrow">Payment offers</div><h2>Offer / coupon codes</h2>
      <form className="admin-form" onSubmit={saveOffer}>
        <input className="field" placeholder="Offer code" value={offerForm.code} onChange={e=>setOfferForm({...offerForm,code:e.target.value.toUpperCase()})} required/>
        <div className="admin-grid"><select className="field" value={offerForm.discountType} onChange={e=>setOfferForm({...offerForm,discountType:e.target.value})}><option>PERCENT</option><option>FLAT</option></select><input className="field" placeholder="Discount value" value={offerForm.discountValue} onChange={e=>setOfferForm({...offerForm,discountValue:e.target.value})}/></div>
        <div className="admin-grid"><input className="field" placeholder="Max redemptions" value={offerForm.maxRedemptions} onChange={e=>setOfferForm({...offerForm,maxRedemptions:e.target.value})}/><input className="field" placeholder="Per-user limit" value={offerForm.perUserLimit} onChange={e=>setOfferForm({...offerForm,perUserLimit:e.target.value})}/></div>
        <input className="field" placeholder="Minimum purchase ₹" value={offerForm.minPurchase} onChange={e=>setOfferForm({...offerForm,minPurchase:e.target.value})}/>
        <div className="chips">{["Plus","Pro","Premium"].map(p=><button type="button" className={"chip "+(offerForm.applicablePlans.includes(p)?"active":"")} key={p} onClick={()=>setOfferForm({...offerForm,applicablePlans:offerForm.applicablePlans.includes(p)?offerForm.applicablePlans.filter((x:string)=>x!==p):[...offerForm.applicablePlans,p]})}>{p}</button>)}</div>
        <button className="btn">Create / update offer</button>
      </form>
      {offers.map(o=><div className="admin-row" key={o.id}><div><b>{o.code}</b><div className="sub">{o.discount_type} {o.discount_value} · {o.applicable_plans?.join(", ")||"all plans"} · {o.enabled?"active":"off"}</div></div><button className="btn ghost" onClick={async()=>{await fetch("/api/offers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle",code:o.code,enabled:!o.enabled})});load();}}>{o.enabled?"Switch off":"Switch on"}</button></div>)}
    </section>
    <section className="panel">
      <div className="eyebrow">Festival control</div><h2>Create a special festival</h2>
      <p className="sub">A festival is invisible to users while off. When live, the festival hub appears in their account and lets them roam between its activities.</p>
      <form className="admin-form" onSubmit={createFestival}>
        <input className="field" placeholder="Festival name" value={festivalForm.name} onChange={e=>setFestivalForm({...festivalForm,name:e.target.value})} required/>
        <input className="field" placeholder="Short slug (optional)" value={festivalForm.slug} onChange={e=>setFestivalForm({...festivalForm,slug:e.target.value})}/>
        <input className="field" placeholder="Tagline" value={festivalForm.tagline} onChange={e=>setFestivalForm({...festivalForm,tagline:e.target.value})}/>
        <textarea className="field admin-textarea" placeholder="Description" value={festivalForm.description} onChange={e=>setFestivalForm({...festivalForm,description:e.target.value})}/>
        <div className="admin-grid"><input className="field" placeholder="City" value={festivalForm.city} onChange={e=>setFestivalForm({...festivalForm,city:e.target.value})}/><input className="field" placeholder="Emoji" value={festivalForm.coverEmoji} onChange={e=>setFestivalForm({...festivalForm,coverEmoji:e.target.value})}/></div>
        <button className="btn">Create festival</button>
      </form>
      {festival.map(f=><div className="admin-row" key={f.id}><div><b>{f.coverEmoji} {f.name}</b><div className="sub">{f.city||"All cities"} · {f.isLive?"LIVE — visible to users":"OFF — hidden from users"}</div></div><button className={f.isLive?"btn ghost":"btn"} onClick={()=>toggleFestival(f.id)}>{f.isLive?"Switch off":"Go live"}</button></div>)}
    </section>

    <section className="panel"><div className="eyebrow">Festival activities</div><h2>Add activities</h2>
      <form className="admin-form" onSubmit={createActivity}>
        <input className="field" placeholder="Activity name" value={activityForm.activityName} onChange={e=>setActivityForm({...activityForm,activityName:e.target.value})} required/>
        <div className="admin-grid"><input className="field" placeholder="Category" value={activityForm.category} onChange={e=>setActivityForm({...activityForm,category:e.target.value})}/><input className="field" placeholder="City" value={activityForm.city} onChange={e=>setActivityForm({...activityForm,city:e.target.value})}/></div>
        <input className="field" placeholder="Capacity (optional)" value={activityForm.capacity} onChange={e=>setActivityForm({...activityForm,capacity:e.target.value})}/>
        <textarea className="field admin-textarea" placeholder="Description" value={activityForm.description} onChange={e=>setActivityForm({...activityForm,description:e.target.value})}/>
        <button className="btn">Add activity</button>
      </form>
      <div className="sub">{activities.length} activity records available. New festivals currently attach all available activities; activity selection can be refined in the next admin iteration.</div>
    </section>

    <section className="panel"><div className="eyebrow">Identity verification</div><h2>Review camera captures</h2>
      <p className="sub">Private verification images are only served through this admin session. Final decisions delete the three temporary captures.</p>
      {verifications.length===0?<div className="safe">No verification records.</div>:verifications.map(v=><div className="admin-row" key={v.userId}><div className="grow"><b>{v.displayName||v.legalName} · {v.city||"Unknown city"}</b><div className="sub">{v.email||""} · {v.governmentIdType} •••• {v.governmentIdLast4} · <b>{v.status}</b></div>{v.selfieFrontUrl&&<div className="verification-media">{["front","left","right"].map((k,i)=><img key={k} src={`/api/admin/verification/media?pathname=${encodeURIComponent([v.selfieFrontUrl,v.selfieLeftUrl,v.selfieRightUrl][i])}`} alt={k+" verification capture"} style={{width:110,height:140,objectFit:"cover",borderRadius:12}}/> )}</div>}</div><div className="actions"><button className="btn" disabled={v.status!=="pending"} onClick={()=>decideVerification(v.userId,"verified")}>Verify</button><button className="btn ghost" disabled={v.status!=="pending"} onClick={()=>decideVerification(v.userId,"rejected")}>Reject</button><button className="btn ghost" disabled={v.status!=="pending"} onClick={()=>decideVerification(v.userId,"restricted")}>Restrict</button></div></div>)}
    </section>

    <section className="panel"><div className="eyebrow">User notifications</div><h2>Publish a notification</h2>
      <p className="sub">Choose whether it appears as a full-page login popup, in the notification center, or both. Publishing is immediate.</p>
      <form className="admin-form" onSubmit={publishNotification}>
        <input className="field" placeholder="Notification title" value={noteForm.title} onChange={e=>setNoteForm({...noteForm,title:e.target.value})} required/>
        <textarea className="field admin-textarea" placeholder="Message" value={noteForm.body} onChange={e=>setNoteForm({...noteForm,body:e.target.value})} required/>
        <div className="admin-grid"><select className="field" value={noteForm.audience} onChange={e=>setNoteForm({...noteForm,audience:e.target.value})}><option value="all">All users</option><option value="active">Active users</option><option value="city">Specific city</option></select><input className="field" placeholder="City for city audience" value={noteForm.city} onChange={e=>setNoteForm({...noteForm,city:e.target.value})}/></div>
        <label className="check"><input type="checkbox" checked={noteForm.showPopup} onChange={e=>setNoteForm({...noteForm,showPopup:e.target.checked})}/> Show as full-page popup after login</label>
        <button className="btn">Publish now</button>
      </form>
      {notifications.map(n=><div className="admin-row" key={n.id}><div><b>{n.title}</b><div className="sub">{n.audience}{n.city?" · "+n.city:""} · {n.showPopup?"popup + notification center":"notification center"} · {n.isActive?"active":"off"}</div></div><button className="btn ghost" onClick={()=>toggleNotification(n.id,n.isActive)}>{n.isActive?"Switch off":"Switch on"}</button></div>)}
    </section>
  </main>;
}
