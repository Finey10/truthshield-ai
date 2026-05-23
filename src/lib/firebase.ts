// src/lib/firebase.ts
// ─────────────────────────────────────────────────────────────
// Firebase setup + all Firestore helpers for TruthShield AI
// ─────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

// ── 1. Config ─────────────────────────────────────────────────
// These come from your .env.local file (see SETUP.md)
const firebaseConfig = {
  apiKey: "AIzaSyDoMJ_pNV_Fb9FFxImn3lok6JfGlFDXDXY",
  authDomain: "truthshield-7b9c5.firebaseapp.com",
  projectId: "truthshield-7b9c5",
  storageBucket: "truthshield-7b9c5.firebasestorage.app",
  messagingSenderId: "25602611040",
  appId: "1:25602611040:web:78c4b61a501238df91b005",
  measurementId: "G-JXV94RHDNW"
};

// Prevent re-initialising on hot reload in Next.js dev mode
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)

// ── 2. Types ──────────────────────────────────────────────────
export type RiskLevel = 'safe' | 'suspicious' | 'dangerous'
export type InputType = 'text' | 'image' | 'url'

export interface ScanRecord {
  id?: string                // Firestore document ID (added after fetch)
  input_type: InputType
  snippet: string            // first 120 chars of input (for history display)
  risk_score: number
  risk_level: RiskLevel
  red_flags: string[]
  explanation: string
  recommendations: string[]
  extracted_text?: string    // only for image scans
  url?: string               // only for url scans
  created_at: Timestamp | null
}

// ── 3. Save a scan result ─────────────────────────────────────
/**
 * Call this right after a successful API response.
 * Returns the new Firestore document ID.
 *
 * Example:
 *   const id = await saveScan('text', textInput, apiResult)
 */
export async function saveScan(
  inputType: InputType,
  rawInput: string,
  result: Omit<ScanRecord, 'id' | 'input_type' | 'snippet' | 'created_at'>
): Promise<string> {
  const snippet = rawInput.trim().slice(0, 120) + (rawInput.length > 120 ? '…' : '')

  const doc: Omit<ScanRecord, 'id'> = {
    input_type:      inputType,
    snippet,
    risk_score:      result.risk_score,
    risk_level:      result.risk_level,
    red_flags:       result.red_flags      ?? [],
    explanation:     result.explanation    ?? '',
    recommendations: result.recommendations ?? [],
    extracted_text:  result.extracted_text,
    created_at:      serverTimestamp() as Timestamp,
    ...(result.extracted_text !== undefined && { extracted_text: result.extracted_text }),
  ...(result.url            !== undefined && { url: result.url }),
  }

  const ref = await addDoc(collection(db, 'scans'), doc)
  return ref.id
}

// ── 4. Fetch recent scans ─────────────────────────────────────
/**
 * Returns the 50 most recent scans, newest first.
 *
 * Example:
 *   const scans = await getRecentScans()
 */
export async function getRecentScans(count = 50): Promise<ScanRecord[]> {
  const q = query(
    collection(db, 'scans'),
    orderBy('created_at', 'desc'),
    limit(count)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScanRecord))
}
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const logOut = () => signOut(auth)
export { onAuthStateChanged }