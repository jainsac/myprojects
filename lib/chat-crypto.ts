const DB_NAME = "cuddl-secure-chat";
const STORE_NAME = "keys";
const KEY_ID = "identity";

type StoredKeyPair = {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
};

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open secure key storage."));
  });
}

async function getStoredKeyPair(): Promise<StoredKeyPair | null> {
  const db = await openKeyDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(KEY_ID);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Could not read secure key storage."));
  });
}

async function storeKeyPair(pair: StoredKeyPair) {
  const db = await openKeyDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(pair, KEY_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Could not save secure key storage."));
  });
}

async function generateKeyPair() {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  ) as Promise<CryptoKeyPair>;
}

export async function ensureChatKeyPair() {
  if (!window.crypto?.subtle || !window.indexedDB) throw new Error("This browser does not support secure chat storage.");
  const existing = await getStoredKeyPair();
  if (existing) return existing;

  const generated = await generateKeyPair();
  const pair = { privateKey: generated.privateKey, publicKey: generated.publicKey };
  await storeKeyPair(pair);
  return pair;
}

async function publicJwk(key: CryptoKey) {
  return crypto.subtle.exportKey("jwk", key);
}

export async function registerChatPublicKey() {
  const pair = await ensureChatKeyPair();
  const publicKeyJwk = await publicJwk(pair.publicKey);
  const response = await fetch("/api/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKeyJwk }),
  });
  if (!response.ok) throw new Error("Could not register secure chat key.");
  return publicKeyJwk;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function deriveAesKey(privateKey: CryptoKey, otherPublicJwk: JsonWebKey) {
  const otherPublicKey = await crypto.subtle.importKey(
    "jwk",
    otherPublicJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const shared = await crypto.subtle.deriveBits(
    { name: "ECDH", public: otherPublicKey },
    privateKey,
    256
  );
  const digest = await crypto.subtle.digest("SHA-256", shared);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptChatMessage(plaintext: string, recipientPublicJwk: JsonWebKey) {
  const pair = await ensureChatKeyPair();
  const key = await deriveAesKey(pair.privateKey, recipientPublicJwk);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    keyVersion: 1,
  };
}

export async function decryptChatMessage(ciphertext: string, iv: string, senderPublicJwk: JsonWebKey) {
  const pair = await ensureChatKeyPair();
  const key = await deriveAesKey(pair.privateKey, senderPublicJwk);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
  return new TextDecoder().decode(plaintext);
}
