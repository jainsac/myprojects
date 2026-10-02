import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { identitySignals, identityVerifications } from "../../../../lib/db/schema";

const ALLOWED = new Set(["front","left","right"]);

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const body = await request.json();
    const captures = body?.captures && typeof body.captures === "object" ? body.captures : {};
    for (const key of ["front","left","right"]) {
      const item = captures[key];
      if (!item || typeof item.hash !== "string" || !/^[a-f0-9]{64}$/i.test(item.hash)) {
        return NextResponse.json({ error: "All three camera captures are required." }, { status: 400 });
      }
    }

    const submission = {
      mode: "free-local-camera",
      submittedAt: new Date().toISOString(),
      captures: Object.fromEntries(
        ["front","left","right"].map((key) => {
          const item = captures[key];
          return [key, {
            hash: String(item.hash),
            size: Number(item.size || 0),
            type: String(item.type || "image/jpeg")
          }];
        })
      )
    };

    const db = getDb();
    await db.update(identityVerifications)
      .set({
        status: "pending",
        provider: "local-free",
        providerReference: JSON.stringify(submission),
        updatedAt: new Date()
      })
      .where(eq(identityVerifications.userId, current.user.id));

    for (const key of ["front","left","right"]) {
      const item = captures[key];
      await db.insert(identitySignals).values({
        userId: current.user.id,
        signalType: `free_camera_${key}`,
        fingerprint: String(item.hash),
        confidence: null,
        action: "submitted_for_manual_review"
      });
    }

    return NextResponse.json({
      ok: true,
      status: "pending",
      reviewNote: "Free mode records capture fingerprints and completion only. It does not prove government-ID authenticity or biometric identity."
    });
  } catch (error) {
    console.error("free verification submission failed", error);
    return NextResponse.json({ error: "Could not submit verification." }, { status: 500 });
  }
}

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = getDb();
  const rows = await db.select().from(identityVerifications)
    .where(eq(identityVerifications.userId, current.user.id)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ status: "not_started" });
  return NextResponse.json({
    status: row.status,
    provider: row.provider,
    submittedAt: row.updatedAt || row.createdAt
  });
}
