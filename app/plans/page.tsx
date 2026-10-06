"use client";
import { useEffect, useState } from "react";

type Config={launchMode:"FREE_ALL"|"MONETIZED";plans:Record<string,{prices:Record<string,number>,tag?:string,copy?:string}>,features:Array<{key:string,name:string,description:string,plans:string[],audience?:string[]}>;standaloneProducts:Array<any>;bundles:Array<any>};

export default function Plans(){
  const [config,setConfig]=useState<Config|null>(null);
  const [selectedPlan,setSelectedPlan]=useState("Plus");
  const [offerCode,setOfferCode]=useState("");
  const [offer,setOffer]=useState<any>(null);
  const [offerError,setOfferError]=useState("");
  const [offerBusy,setOfferBusy]=useState(false);

  useEffect(()=>{fetch("/api/plan-config").then(r=>r.json()).then(setConfig).catch(()=>setConfig(null));},[]);

  async function applyOffer(){
    setOfferBusy(true);setOfferError("");setOffer(null);
    try{
      const r=await fetch("/api/offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:offerCode,plan:selectedPlan})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not apply offer");setOffer(d);
    }catch(e){setOfferError(e instanceof Error?e.message:"Could not apply offer");}finally{setOfferBusy(false);}
  }

  if(!config)return <main className="policy-page"><a href="/" className="policy-back">← Back to Cuddl</a><div className="eyebrow">Cuddl plans</div><h1>Plans & Premium</h1><p className="sub">Loading current plan configuration…</p></main>;

  const planOrder=["Basic","Plus","Pro","Premium"];
  const plans=planOrder.filter(name=>config.plans[name]).map(name=>[name,config.plans[name]] as [string,Config["plans"][string]]);
  const periods=["Monthly","Quarterly","Half-year","Annual"];
  const actionPriority=(plan:string)=>plan==="Premium"?"Premium → Pro → Plus → Basic":plan==="Pro"?"Pro → Plus → Basic":plan==="Plus"?"Plus → Basic":"Basic";

  return <main className="policy-page">
    <a href="/" className="policy-back">← Back to Cuddl</a>
    <div className="eyebrow">Cuddl plans</div><h1>Plans & Premium</h1>
    <p className="sub">Features and prices shown here are controlled by the Cuddl admin configuration. They can change as the product evolves.</p>
    <section className="panel offer-code-panel">
      <div className="eyebrow">Have an offer?</div><h2>🎟️ Apply an offer code</h2>
      <p className="sub">Select the plan you want to buy, enter your code and validate it before checkout.</p>
      <div className="admin-grid"><select className="field" value={selectedPlan} onChange={e=>{setSelectedPlan(e.target.value);setOffer(null);setOfferError("");}}>{plans.filter(([n])=>n!=="Basic").map(([n])=><option key={n}>{n}</option>)}</select><input className="field" placeholder="Offer / coupon code" value={offerCode} onChange={e=>setOfferCode(e.target.value.toUpperCase())}/></div>
      <button className="btn" onClick={applyOffer} disabled={offerBusy||!offerCode}>{offerBusy?"Checking…":"Apply code"}</button>
      {offer&&<div className="safe">✓ Code valid · {offer.discountType==="PERCENT"?offer.discountValue+"% off":"₹"+offer.discountValue+" off"}{offer.rewardType&&offer.rewardType!=="DISCOUNT"?" · "+offer.rewardType:""}</div>}
      {offerError&&<div className="auth-error">{offerError}</div>}
    </section>
    {config.launchMode==="FREE_ALL"&&<section className="panel" style={{marginBottom:18}}><div className="eyebrow">Launch testing</div><h2>🎉 Everything is free right now</h2><p className="sub">During the Cuddl testing phase, every user gets access to all premium-level features. This helps us test scale, engagement and feature usage before monetization is switched on.</p></section>}
    <div className="plan-grid">
      {plans.map(([name,plan],planIndex)=>{
        const previousPlan=planIndex>0?plans[planIndex-1][0]:null;
        const priorNames=plans.slice(0,planIndex).map(([n])=>n);
        const uniqueFeatures=config.features.filter(f=>f.plans.includes(name)&&!f.plans.some(p=>priorNames.includes(p)));
        return <section className={"plan-card "+(name==="Pro"?"plan-highlight":"")} key={name}>
          <div className="eyebrow">{name}</div><h2>{plan.tag||name}</h2><p>{plan.copy||""}</p>
          <div className="plan-prices">{periods.filter(p=>plan.prices[p]!==undefined).map(p=><div key={p}><span>{p}</span><b>₹{Number(plan.prices[p]).toLocaleString("en-IN")}</b></div>)}</div>
          <ul className="plan-benefits">
            {previousPlan&&<li className="plan-inherited">✓ Everything included in {previousPlan}</li>}
            {uniqueFeatures.map(f=><li key={f.key}>✓ {f.name}</li>)}
          </ul>
          <div className="safe"><b>{previousPlan?"New benefits":"Included benefits"}:</b> {uniqueFeatures.length} · {previousPlan?"Everything from "+previousPlan+" is included.":"Core Cuddl experience."}</div>
          <button className="btn" onClick={()=>{setSelectedPlan(name);alert(name==="Basic"?"Basic is free.":"Checkout gateway is not connected in this test build.");}}>{name==="Basic"?"Current plan":"Choose "+name}</button>
        </section>;
      })}
    </div>
  </main>;
}
