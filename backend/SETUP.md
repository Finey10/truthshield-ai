# TruthShield AI — Setup Guide

## Project Structure

```
truthshield-ai/           ← your existing Next.js project
├── src/app/
│   ├── layout.tsx         ← REPLACE with layout.tsx
│   ├── globals.css        ← REPLACE with globals.css
│   ├── page.tsx           ← REPLACE with page-home.tsx content
│   ├── scanner/
│   │   └── page.tsx       ← NEW — paste page-scanner.tsx content
│   ├── history/
│   │   └── page.tsx       ← NEW — paste page-history.tsx content
│   └── about/
│       └── page.tsx       ← REPLACE with page-about.tsx content
├── src/components/
│   └── Navbar.tsx         ← NEW — paste Navbar.tsx content
└── .env.local             ← add NEXT_PUBLIC_API_URL

backend/                  ← NEW folder (outside Next.js)
├── main.py
├── requirements.txt
└── .env
```

---

## Step 1 — Frontend Setup

### 1a. Copy files into your Next.js project

```
src/app/layout.tsx         ← layout.tsx
src/app/globals.css        ← globals.css
src/app/page.tsx           ← page-home.tsx
src/app/scanner/page.tsx   ← page-scanner.tsx  (create folder)
src/app/history/page.tsx   ← page-history.tsx  (create folder)
src/app/about/page.tsx     ← page-about.tsx
src/components/Navbar.tsx  ← Navbar.tsx         (create folder)
```

### 1b. Create `.env.local` in your Next.js root

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 1c. Run the frontend

```bash
npm run dev
```

---

## Step 2 — Backend Setup

### 2a. Install Tesseract OCR (system dependency)

**Windows:**
Download from https://github.com/UB-Mannheim/tesseract/wiki
Add install path to system PATH (e.g. C:\Program Files\Tesseract-OCR)

**Mac:**
```bash
brew install tesseract
```

**Linux/Ubuntu:**
```bash
sudo apt-get install tesseract-ocr
```

### 2b. Create backend folder and install Python deps

```bash
mkdir backend && cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2c. Create `backend/.env`

```env
ANTHROPIC_API_KEY=sk-ant-...
VIRUSTOTAL_API_KEY=your_key_here        # optional but recommended
GOOGLE_SAFE_BROWSING_KEY=your_key_here  # optional
FRONTEND_URL=http://localhost:3000
```

### 2d. Copy main.py and requirements.txt into backend/

### 2e. Run the backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Test it: open http://localhost:8000 — should return `{"status": "TruthShield AI backend running"}`

---

## Step 3 — Get API Keys

| Service | Get Key At | Free? |
|---------|-----------|-------|
| Anthropic (Claude) | https://console.anthropic.com | $5 free credit |
| VirusTotal | https://www.virustotal.com/gui/join-us | Free tier |
| Google Safe Browsing | https://console.cloud.google.com | Free |

---

## Step 4 — Test End to End

1. Backend running on :8000
2. Frontend running on :3000
3. Go to http://localhost:3000/scanner
4. Paste: `"Your account will be suspended. Click here to verify: http://paypal-secure-login.net"`
5. Click Analyze — should return risk_score ~85, risk_level: dangerous

---

## Step 5 — Deploy

### Frontend → Vercel
```bash
npm install -g vercel
vercel
# Set env var: NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
```

### Backend → Render
- New Web Service → connect GitHub repo (backend folder)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add environment variables in Render dashboard

---

## Firebase (optional — for scan history persistence)

Install: `npm install firebase`

Create `src/lib/firebase.ts`:
```ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
```

In `page-history.tsx`, replace the `setRecords(DEMO)` line with:
```ts
const q = query(collection(db, 'scans'), orderBy('timestamp', 'desc'), limit(50))
const snap = await getDocs(q)
setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ScanRecord))
```
