import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { encryptionPublicKeys } from "../../../lib/db/schema";

export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const raw = new URL(request.url).searchParams.get("userIds");
  const requested = raw ? raw.split(",").map(x => x.trim()).filter(Boolean).slice(0, 50) : [current.user.id];
  const db = getDb();
  const rows = await db.select({
    userId: encryptionPublicKeys.userId,
    publicKeyJwk: encryptionPublicKeys.publicKeyJwk,
    keyVersion: encryptionPublicKeys.keyVersion,
  }).from(encryptionPublicKeys).where(inArray(encryptionPublicKeys.userId, requested));
  return NextResponse.json({ keys: rows });
}

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const body = await request.json();
    const publicKeyJwk = body?.publicKeyJwk;
    if (!publicKeyJwk || typeof publicKeyJwk !== "object" || publicKeyJwk.kty !== "EC" || publicKeyJwk.crv !== "P-256" || !publicKeyJwk.x || !publicKeyJwk.y) {
      return NextResponse.json({ error: "A valid P-256 public key is required." }, { status: 400 });
    }

    const db = getDb();
    await db.insert(encryptionPublicKeys).values({
      userId: current.user.id,
      publicKeyJwk,
      keyVersion: 1,
    }).onConflictDoUpdate({
      target: encryptionPublicKeys.userId,
      set: { publicKeyJwk, updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not register encryption key." }, { status: 500 });
  }
}
