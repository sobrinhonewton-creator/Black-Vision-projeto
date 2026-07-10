/**
 * services/firebase.js — Firebase Admin SDK (singleton)
 * Com try/catch para não travar o servidor se credenciais estiverem erradas
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore as createFirestore } from "firebase-admin/firestore";

let _db         = null;
let _initFailed = false;

export function initFirebase() {
  if (getApps().length > 0) return true;
  if (_initFailed) return false;

  try {
    const projectId   = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const rawKey      = process.env.FIREBASE_PRIVATE_KEY || "";
    const privateKey  = rawKey
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/^"|"$/g, "")
      .trim();

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Variáveis FIREBASE_* ausentes no .env");
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

    console.log("✅ Firebase Admin initialized");
    return true;
  } catch (err) {
    _initFailed = true;
    console.warn(`⚠️  Firebase não inicializado: ${err.message}`);
    console.warn("   Transações salvas apenas em memória.");
    return false;
  }
}

export function getFirestore() {
  if (_initFailed) throw new Error("Firebase indisponível");
  if (!_db) {
    const ok = initFirebase();
    if (!ok) throw new Error("Firebase indisponível");
    _db = createFirestore();
  }
  return _db;
}
