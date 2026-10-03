import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI coach is not configured yet." }, { status: 503 });

  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    if (messages.length < 4) return NextResponse.json({ error: "Not enough conversation yet." }, { status: 400 });
    const transcript = messages.map((m:any)=>`${m.mine ? "User" : "Match"}: ${String(m.text||"").slice(0,500)}`).join("\n");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.CUDDL_AI_MODEL || "gpt-6-luna",
        instructions: "You are Cuddl's optional dating conversation coach. Analyze only the supplied recent conversation. Never diagnose people, infer sensitive traits, or claim certainty about attraction. Give practical, respectful suggestions. Do not write messages for the user to copy verbatim; give topics or directions in their own voice. Return exactly 3 short suggestions as a JSON array of strings.",
        input: transcript,
        max_output_tokens: 180
      })
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "AI coach request failed." }, { status: 502 });
    const raw = String(data.output_text || "").trim();
    let suggestions:string[]=[];
    try { suggestions = JSON.parse(raw); } catch {
      suggestions = raw.split("\n").map((x:string)=>x.replace(/^[-*\d.)]+\s*/,"").trim()).filter(Boolean).slice(0,3);
    }
    return NextResponse.json({ suggestions: suggestions.slice(0,3) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not generate conversation suggestions." }, { status: 500 });
  }
}