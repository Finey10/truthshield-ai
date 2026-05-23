// src/lib/firebase.ts
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
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

// ── 1. Config ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDoMJ_pNV_Fb9FFxImn3lok6JfGlFDXDXY",
  authDomain: "truthshield-7b9c5.firebaseapp.com",
  projectId: "truthshield-7b9c5",
  storageBucket: "truthshield-7b9c5.firebasestorage.app",
  messagingSenderId: "25602611040",
  appId: "1:25602611040:web:78c4b61a501238df91b005",
  measurementId: "G-JXV94RHDNW"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)

// ── 2. Auth ───────────────────────────────────────────────────
export const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

let signingIn = false
export const signInWithGoogle = async () => {
  if (signingIn) return
  signingIn = true
  try {
    await signInWithPopup(auth, googleProvider)
  } finally {
    signingIn = false
  }
}
export const logOut = () => signOut(auth)
export { onAuthStateChanged }

// ── 3. Types ──────────────────────────────────────────────────
export type RiskLevel = 'safe' | 'suspicious' | 'dangerous'
export type InputType = 'text' | 'image' | 'url'

export interface ScanRecord {
  id?: string
  input_type: InputType
  snippet: string
  risk_score: number
  risk_level: RiskLevel
  red_flags: string[]
  explanation: string
  recommendations: string[]
  extracted_text?: string
  url?: string
  uid?: string
  created_at: Timestamp | null
}

// ── 4. Save a scan result ─────────────────────────────────────
export async function saveScan(
  inputType: InputType,
  rawInput: string,
  result: Omit<ScanRecord, 'id' | 'input_type' | 'snippet' | 'created_at'>,
  uid: string
): Promise<string> {
  const snippet = rawInput.trim().slice(0, 120) + (rawInput.length > 120 ? '…' : '')

  const doc: Omit<ScanRecord, 'id'> = {
    input_type:      inputType,
    snippet,
    risk_score:      result.risk_score      ?? 0,
    risk_level:      result.risk_level      ?? 'safe',
    red_flags:       result.red_flags       ?? [],
    explanation:     result.explanation     ?? '',
    recommendations: result.recommendations ?? [],
    uid,
    created_at:      serverTimestamp() as Timestamp,
    ...(result.extracted_text !== undefined && { extracted_text: result.extracted_text }),
    ...(result.url            !== undefined && { url: result.url }),
  }

  const ref = await addDoc(collection(db, 'users', uid, 'scans'), doc)
  return ref.id
}

// ── 5. Fetch recent scans for a user ─────────────────────────
export async function getRecentScans(uid: string, count = 50): Promise<ScanRecord[]> {
  const q = query(
    collection(db, 'users', uid, 'scans'),
    orderBy('created_at', 'desc'),
    limit(count)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScanRecord))
}