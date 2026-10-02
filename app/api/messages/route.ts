import { NextResponse } from "next/server";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { encryptionPublicKeys, matches, messages } from "../../../lib/db/schema";

export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const matchId = new URL(request.url).searchParams.get("matchId") || "";
  const db = getDb();

  const match = await db.select().from(matches).where(
    and(eq(matches.id, matchId), or(eq(matches.userAId, current.user.id), eq(matches.userBId, current.user.id)))
  ).limit(1);
  if (!match.length) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  const rows = await db.select().from(messages).where(eq(messages.matchId, matchId)).orderBy(asc(messages.createdAt));
  const senderIds = [...new Set(rows.map(row => row.senderId))];
  const keys = senderIds.length
    ? await db.select({ userId: encryptionPublicKeys.userId, publicKeyJwk: encryptionPublicKeys.publicKeyJwk, keyVersion: encryptionPublicKeys.keyVersion })
        .from(encryptionPublicKeys).where(inArray(encryptionPublicKeys.userId, senderIds))
    : [];
  const keyMap = new Map(keys.map(key => [key.userId, key]));

  return NextResponse.json({
    encrypted: true,
    messages: rows.map(row => ({
      id: row.id,
      matchId: row.matchId,
      senderId: row.senderId,
      body: row.metadata?.encrypted === true ? row.body : null,
      metadata: row.metadata?.encrypted === true ? row.metadata : { encrypted: false, legacy: true },
      createdAt: row.createdAt,
      senderPublicKey: keyMap.get(row.senderId)?.publicKeyJwk ?? null,
      senderKeyVersion: keyMap.get(row.senderId)?.keyVersion ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const body = await request.json();
    const matchId = String(body.matchId || "");
    const ciphertext = String(body.ciphertext || "");
    const iv = String(body.iv || "");
    const keyVersion = Number(body.keyVersion || 1);
    if (!matchId || !ciphertext || !iv) {
      return NextResponse.json({ error: "Encrypted message payload is required." }, { status: 400 });
    }

    const db = getDb();
    const match = await db.select().from(matches).where(
      and(eq(matches.id, matchId), or(eq(matches.userAId, current.user.id), eq(matches.userBId, current.user.id)))
    ).limit(1);
    if (!match.length) return NextResponse.json({ error: "Match not found." }, { status: 404 });

    const [message] = await db.insert(messages).values({
      matchId,
      senderId: current.user.id,
      body: ciphertext,
      metadata: {
        encrypted: true,
        algorithm: "ECDH-P256/AES-GCM",
        iv,
        keyVersion: Number.isFinite(keyVersion) ? keyVersion : 1,
      },
    }).returning();

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        matchId: message.matchId,
        senderId: message.senderId,
        body: message.body,
        metadata: message.metadata,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not send encrypted message." }, { status: 500 });
  }
}
