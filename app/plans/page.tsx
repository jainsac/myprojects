"use client";

type Plan={
  name:string; tag:string; copy:string; benefits:string[];
  prices:[string,string][]; highlight:boolean;
};

const plans:Plan[]=[
  {
    name:"Basic",tag:"Free",highlight:false,
    copy:"A complete free Cuddl experience with core discovery, activities and matching.",
    benefits:[
      "Profile creation & mandatory profile completion",
      "Activity, game, music & social discovery",
      "Core search and filters",
      "Daily Sparks and mutual Spark → Match",
      "Matches and secure chat",
      "Safety, report, block and privacy controls",
      "Free identity-check flow where available",
      "Standard discovery priority",
      "No Boost credits, no Super Sparks and no pre-match message credits"
    ],
    prices:[["Monthly","₹0"]]
  },
  {
    name:"Plus",tag:"From ₹99/month",highlight:false,
    copy:"More discovery control plus entry-level visibility tools.",
    benefits:[
      "Everything in Basic",
      "5 Boosts per month · 30 minutes each",
      "Boosts reset monthly and do not carry forward on quarterly, half-year or annual plans",
      "Advanced search & discovery filters",
      "Profile Revisit / Rewind",
      "Who Sparked You — limited",
      "More activity/game access",
      "Standard paid-plan priority over Basic",
      "0 pre-match message credits",
      "5 Super Sparks per month"
    ],
    prices:[["Monthly","₹99"],["Quarterly","₹199"],["Half-year","₹399"],["Annual","₹599"]]
  },
  {
    name:"Pro",tag:"From ₹149/month",highlight:true,
    copy:"Higher visibility and stronger interaction priority for active daters.",
    benefits:[
      "Everything in Plus",
      "10 Boosts per month · 60 minutes each",
      "Boosts reset monthly and do not carry forward on multi-month plans",
      "Priority discovery placement above Plus for the same action",
      "10 pre-match message credits per month",
      "15 Super Sparks per month",
      "Full Who Sparked You",
      "Advanced compatibility insights",
      "Incognito discovery",
      "Unlimited profile revisits",
      "Priority activity access"
    ],
    prices:[["Monthly","₹149"],["Quarterly","₹349"],["Half-year","₹599"],["Annual","₹999"]]
  },
  {
    name:"Premium",tag:"From ₹299/month",highlight:false,
    copy:"The highest Cuddl visibility, interaction and activity toolkit.",
    benefits:[
      "Everything in Pro",
      "15 Boosts per month · 120 minutes each",
      "Boosts reset monthly and do not carry forward on multi-month plans",
      "Priority discovery placement above Pro, Plus and Basic for the same action",
      "30 pre-match message credits per month",
      "30 Super Sparks per month",
      "Super Spark and pre-match messages appear at the top of the receiver's received queue",
      "Priority Boost visibility",
      "Travel Mode and premium discovery controls",
      "Premium activity & game rooms",
      "Premium date tools",
      "Private albums / enhanced privacy controls",
      "Advanced Connection features"
    ],
    prices:[["Monthly","₹299"],["Quarterly","₹799"],["Half-year","₹1,499"],["Annual","₹2,499"]]
  }
];

function actionPriority(plan:string){
  if(plan==="Premium") return "Premium → Pro → Plus → Basic";
  if(plan==="Pro") return "Pro → Plus → Basic";
  if(plan==="Plus") return "Plus → Basic";
  return "Basic";
}

export default function Plans(){
  return <main className="policy-page">
    <a href="/" className="policy-back">← Back to Cuddl</a>
    <div className="eyebrow">Cuddl plans</div><h1>Plans & Premium</h1>
    <p className="sub">Choose a plan and billing period. Boost, message and Super Spark allowances reset each calendar subscription month; unused monthly allowances do not carry forward into later months.</p>
    <div className="plan-grid">
      {plans.map(plan=><section className={"plan-card "+(plan.highlight?"plan-highlight":"")} key={plan.name}>
        <div className="eyebrow">{plan.name}</div><h2>{plan.tag}</h2><p>{plan.copy}</p>
        <div className="plan-prices">{plan.prices.map(([period,price])=><div key={period}><span>{period}</span><b>{price}</b></div>)}</div>
        <ul className="plan-benefits">{plan.benefits.map(x=><li key={x}>✓ {x}</li>)}</ul>
        <div className="safe"><b>Action priority:</b> {actionPriority(plan.name)}. If two users on the same plan perform the same eligible action, compatibility score is used as the tie-breaker.</div>
        <button className="btn" onClick={()=>alert(plan.name==="Basic"?"Basic is free.":plan.name+" checkout is not connected in this test build.")}>{plan.name==="Basic"?"Current plan":"Choose "+plan.name}</button>
      </section>)}
    </div>
    <section className="policy-section">
      <h2>How Boost, Super Spark & pre-match messages work</h2>
      <p><b>Boost:</b> temporarily increases eligible discovery exposure for its stated duration. A Boost does not guarantee a Spark, Match, reply or date. Monthly Boost allowances reset and unused Boosts do not roll over.</p>
      <p><b>Super Spark:</b> a higher-visibility interest signal. <b>Pre-match message:</b> an eligible plan credit lets a user send a message with a Spark before a mutual Match. For both, the receiver's received queue can place the eligible action near the top according to plan priority.</p>
      <p><b>Priority:</b> when eligible actions compete, Premium is placed ahead of Pro, Pro ahead of Plus, and Plus ahead of Basic. When competing actions come from the same plan, compatibility score is the tie-breaker. This ordering applies to the relevant Cuddl queue/placement, not as a guarantee of response or matching.</p>
    </section>
  </main>
}