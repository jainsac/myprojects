"use client";

import {useMemo, useState} from "react";

const categories = [
  ["Healthcare","Doctors, clinics & diagnostics","🩺"],
  ["Salon & Beauty","Salons, spas & wellness","✂️"],
  ["Restaurants","Tables, dining & waitlists","🍽️"],
  ["Services","Tutors, consultants & more","⚡"],
];

const businesses = [
  ["Dr. Mehta Clinic","General physician","4.9","₹500","12 min"],
  ["Glow Studio","Hair & beauty","4.8","₹700","8 min"],
  ["The Table House","Restaurant","4.7","₹1,200","15 min"],
  ["FitCore Wellness","Fitness & wellness","4.9","₹900","10 min"],
];

type QueueEntry = {number:number; source:"APP"|"OFFLINE"; status:"Waiting"|"Serving"|"Passed"; eta:number};

export default function Home(){
  const [mode,setMode]=useState<"customer"|"business">("customer");
  const [category,setCategory]=useState("All");
  const [demoQueue,setDemoQueue]=useState<QueueEntry[]>([
    {number:1,source:"OFFLINE",status:"Serving",eta:0},
    {number:2,source:"OFFLINE",status:"Waiting",eta:10},
    {number:3,source:"OFFLINE",status:"Waiting",eta:20},
    {number:4,source:"OFFLINE",status:"Waiting",eta:30},
    {number:5,source:"APP",status:"Waiting",eta:40},
  ]);

  const appBooking = demoQueue.find(x=>x.source==="APP");
  const ahead = demoQueue.filter(x=>x.number < (appBooking?.number ?? 0) && x.status!=="Passed").length;
  const activeEta = useMemo(()=>Math.max(0,(appBooking?.eta ?? 0)),[appBooking]);

  const passCurrent = () => setDemoQueue(q=>q.map(x=>x.number===1?{...x,status:"Passed"}:x));
  const serveNext = () => setDemoQueue(q=>{
    const next=q.find(x=>x.status==="Waiting");
    return next ? q.map(x=>x.number===next.number?{...x,status:"Serving"}:x) : q;
  });

  return <main>
    <header><div className="brand"><span className="mark">B</span><span>BookFlow</span></div><nav><a>Discover</a><a>My Queue</a><a>For Business</a><button className="ghost">Sign in</button><button className="primary" onClick={()=>setMode(mode==="customer"?"business":"customer")}>{mode==="customer"?"Business login":"Customer view"}</button></nav></header>

    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">ONE QUEUE · ONLINE + OFFLINE</div>
        <h1>Book your turn.<br/><em>Not a separate queue.</em></h1>
        <p>BookFlow keeps walk-in customers and app bookings in one live queue. Businesses decide which queue numbers can be booked through the app.</p>
        <div className="search"><span>⌕</span><input placeholder="Search a service, business or area"/><button className="primary">Search</button></div>
        <div className="quick"><span>Popular:</span>{["Healthcare","Salon & Beauty","Restaurants"].map(x=><button key={x} onClick={()=>setCategory(x)}>{x}</button>)}</div>
      </div>

      <div className="hero-card">
        <div className="card-top"><span>Live queue · Today</span><span className="live">● Online + offline</span></div>
        <div className="queue-title"><b>Dr. Mehta Clinic</b><small>Average handling time: 10 min</small></div>
        <div className="queue-list">{demoQueue.map(x=><div className={"queue-row "+(x.source==="APP"?"app-row":"")} key={x.number}>
          <strong>#{x.number}</strong><span className={"source "+x.source.toLowerCase()}>{x.source}</span><span>{x.status}</span><small>{x.status==="Passed"?"—":x.status==="Serving"?"Now":x.eta+" min"}</small>
        </div>)}</div>
        <div className="confirmed"><b>App customer #5</b> · estimated turn in {activeEta} min · {ahead} customers ahead</div>
      </div>
    </section>

    <section className="section queue-demo">
      <div className="section-head"><div><div className="eyebrow">HOW THE QUEUE WORKS</div><h2>One sequence. Controlled app positions.</h2></div></div>
      <div className="rule-grid">
        <div><b>1–10</b><span>Queue range</span></div>
        <div><b>#5</b><span>App-reserved position</span></div>
        <div><b>10 min</b><span>Average handling time</span></div>
        <div><b>Live</b><span>ETA recalculation</span></div>
      </div>
      <div className="demo-actions"><button className="ghost" onClick={passCurrent}>Pass #1</button><button className="primary" onClick={serveNext}>Call next</button></div>
      <p className="note">If an app-reserved position is unused, the business can pass it. The queue does not wait for an absent online customer.</p>
    </section>

    <section className="section">
      <div className="section-head"><div><div className="eyebrow">EXPLORE</div><h2>What are you booking today?</h2></div><a>View all →</a></div>
      <div className="categories">{categories.map(([t,s,i])=><button key={t} className={"category "+(category===t?"selected":"")} onClick={()=>setCategory(t)}><span className="cat-icon">{i}</span><b>{t}</b><small>{s}</small></button>)}</div>
    </section>

    <section className="section discover">
      <div className="section-head"><div><div className="eyebrow">NEAR YOU</div><h2>Businesses using live queues</h2></div><div className="filters"><button className="filter">⌖ Delhi</button><button className="filter">Any time⌄</button></div></div>
      <div className="business-grid">{businesses.map(([n,t,r,p,d])=><article className="business" key={n}><div className="business-image">{n.slice(0,1)}</div><div className="business-body"><div className="line"><b>{n}</b><span>★ {r}</span></div><small>{t}</small><div className="meta"><span>{p} onwards</span><span>• {d} away</span></div><button className="book">View queue →</button></div></article>)}</div>
    </section>

    <section className="business-cta"><div><div className="eyebrow">FOR BUSINESS OWNERS</div><h2>Keep walk-ins moving. Fill selected positions online.</h2><p>Set queue ranges, choose app-reserved numbers, define average handling time and manage the live queue from one dashboard.</p></div><button className="primary">Configure your queue →</button></section>
    <footer><div className="brand"><span className="mark">B</span><span>BookFlow</span></div><span>Unified booking & queue platform</span><span>© 2026</span></footer>
  </main>
}
