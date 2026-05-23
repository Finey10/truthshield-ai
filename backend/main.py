"""
TruthShield AI — FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import httpx
import io
import os
import json
import re
from datetime import datetime
from groq import Groq
import firebase_admin
from firebase_admin import auth as fb_auth, credentials

# ── Load env ONCE at the top ──────────────────────────────────────────────────
load_dotenv()

# ── Firebase Admin init ───────────────────────────────────────────────────────
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

def verify_token(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        return fb_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ─────────────────────────────────────────────────────────────────────────────
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI(title="TruthShield AI API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "https://truthshield-ai-beryl.vercel.app/"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq client ───────────────────────────────────────────────────────────────
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

VIRUSTOTAL_KEY    = os.getenv("VIRUSTOTAL_API_KEY", "")
SAFE_BROWSING_KEY = os.getenv("GOOGLE_SAFE_BROWSING_KEY", "")

# ── Request models ────────────────────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str

class URLRequest(BaseModel):
    url: str

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are TruthShield AI, an expert cybersecurity analyst specialising in
scam and phishing detection. Analyse the provided text and return ONLY a valid JSON object
with exactly these fields (no markdown, no extra keys):

{
  "risk_score": <integer 0-100>,
  "risk_level": "<safe|suspicious|dangerous>",
  "red_flags": ["<flag 1>", "<flag 2>", ...],
  "explanation": "<2-4 sentence plain-language explanation>",
  "recommendations": ["<action 1>", "<action 2>", ...]
}

Scoring rules:
- 0-30  → safe        (no significant threats)
- 31-70 → suspicious  (some red flags; verify manually)
- 71-100 → dangerous  (clear phishing/scam indicators)

Be specific about red flags: e.g. "Urgency language: 'account will be blocked'"
rather than just "urgency language". Always output valid JSON."""


# ── AI functions ──────────────────────────────────────────────────────────────

async def analyse_with_groq(text: str) -> dict:
    response = groq_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": f"Analyse this content for threats:\n\n{text}"}
        ],
        temperature=0.1,
        max_tokens=1024,
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```json\s*|^```\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
    return json.loads(raw)


async def analyse_with_mock(text: str) -> dict:
    text_lower = text.lower()
    risk_score = 0
    red_flags = []

    urgency_words = ["urgent", "immediately", "verify now", "action required",
                     "withdraw instantly", "before it's gone", "vip gift", "special offer"]
    for w in urgency_words:
        if w in text_lower:
            risk_score += 20
            red_flags.append(f"Urgency language: '{w}'")

    finance_words = ["bank", "otp", "password", "upi", "account", "rs ", "₹",
                     "withdraw", "transfer", "kyc", "blocked"]
    for w in finance_words:
        if w in text_lower:
            risk_score += 15
            red_flags.append(f"Financial term: '{w}'")

    if "click here" in text_lower or "tap:" in text_lower:
        risk_score += 20
        red_flags.append("Suspicious link prompt detected")

    short_url_domains = ["cutt.ly", "bit.ly", "tinyurl", "t.co", "ow.ly", "goo.gl"]
    for domain in short_url_domains:
        if domain in text_lower:
            risk_score += 25
            red_flags.append(f"URL shortener detected: '{domain}' — hides real destination")

    if "http" in text_lower:
        risk_score += 10
        red_flags.append("External link detected")

    risk_score = min(risk_score, 100)

    if risk_score <= 30:
        level = "safe"
    elif risk_score <= 70:
        level = "suspicious"
    else:
        level = "dangerous"

    return {
        "risk_score": risk_score,
        "risk_level": level,
        "red_flags": red_flags if red_flags else ["No obvious red flags found"],
        "explanation": (
            "Rule-based analysis detected multiple scam indicators in this message."
            if risk_score > 30 else
            "No significant threat indicators were detected in this message."
        ),
        "recommendations": [
            "Do not click any links in this message",
            "Do not share any personal or financial information",
            "Report this SMS to your telecom provider",
            "Verify with your bank directly using their official app or number"
        ]
    }


async def analyse_text_with_ai(text: str) -> dict:
    try:
        return await analyse_with_groq(text)
    except Exception as groq_error:
        print(f"[WARNING] Groq failed: {groq_error}")
        print("[INFO] Using rule-based fallback")
        return await analyse_with_mock(text)


# ── URL reputation check ──────────────────────────────────────────────────────

async def check_url_reputation(url: str) -> dict:
    if not VIRUSTOTAL_KEY:
        return {"checked": False}
    try:
        import base64
        url_id = base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": VIRUSTOTAL_KEY},
                timeout=10,
            )
        if resp.status_code == 200:
            data = resp.json()
            stats = data["data"]["attributes"]["last_analysis_stats"]
            malicious = stats.get("malicious", 0)
            total = sum(stats.values())
            return {"checked": True, "malicious_votes": malicious, "total_engines": total}
    except Exception:
        pass
    return {"checked": False}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "TruthShield AI backend running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"ok": True, "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/analyze/text")
async def analyze_text(req: TextRequest, user: dict = Depends(verify_token)):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(req.text) > 10000:
        raise HTTPException(status_code=400, detail="Text too long (max 10,000 chars)")
    try:
        result = await analyse_text_with_ai(req.text)
        result["uid"] = user["uid"]   # attach user id to response if needed
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/image")
async def analyze_image(file: UploadFile = File(...), user: dict = Depends(verify_token)):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP images are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")

    try:
        image = Image.open(io.BytesIO(contents))
        extracted_text = pytesseract.image_to_string(image).strip()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"OCR failed: {e}")

    if not extracted_text:
        raise HTTPException(status_code=422, detail="No text could be extracted from this image")

    try:
        result = await analyse_text_with_ai(extracted_text)
        result["extracted_text"] = extracted_text
        result["uid"] = user["uid"]
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/url")
async def analyze_url(req: URLRequest, user: dict = Depends(verify_token)):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    import asyncio
    ai_task = asyncio.create_task(analyse_text_with_ai(f"Analyse this URL for threats: {url}"))
    vt_task = asyncio.create_task(check_url_reputation(url))

    try:
        result, vt = await asyncio.gather(ai_task, vt_task)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if vt.get("checked") and vt.get("malicious_votes", 0) > 0:
        boost = min(vt["malicious_votes"] * 5, 30)
        result["risk_score"] = min(result.get("risk_score", 0) + boost, 100)
        result["red_flags"] = result.get("red_flags", []) + [
            f"VirusTotal: flagged by {vt['malicious_votes']}/{vt['total_engines']} engines"
        ]
        if result["risk_score"] >= 71:
            result["risk_level"] = "dangerous"
        elif result["risk_score"] >= 31:
            result["risk_level"] = "suspicious"

    result["virustotal"] = vt
    result["uid"] = user["uid"]
    return result