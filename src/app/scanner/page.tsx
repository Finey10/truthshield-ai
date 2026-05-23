'use client'
import { useState, useRef, useEffect } from 'react'
import { saveScan } from '@/lib/firebase'
import { auth, signInWithGoogle } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { Html5Qrcode } from 'html5-qrcode'

type RiskLevel = 'safe' | 'suspicious' | 'dangerous' | null

interface ScanResult {
  risk_score: number
  risk_level: RiskLevel
  red_flags: string[]
  explanation: string
  recommendations: string[]
  extracted_text?: string
}

const RISK_CONFIG = {
  safe: { label: 'SAFE', color: 'var(--green)', bg: 'rgba(0,255,135,0.08)', border: 'rgba(0,255,135,0.3)' },
  suspicious: { label: 'SUSPICIOUS', color: 'var(--amber)', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.3)' },
  dangerous: { label: 'DANGEROUS', color: 'var(--red)', bg: 'rgba(255,59,59,0.08)', border: 'rgba(255,59,59,0.3)' },
}

export default function ScannerPage() {
  const [tab, setTab] = useState<'text' | 'image' | 'url'>('text')
  const [textInput, setTextInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const qrRef = useRef<Html5Qrcode | null>(null)

  const LOADING_MSGS = [
    'Extracting content...',
    'Running OCR analysis...',
    'Querying threat intelligence...',
    'Running AI detection...',
    'Computing risk score...',
    'Generating explanation...',
  ]

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

// QR scanner
useEffect(() => {
  if (!showQR) return

  const scanner = new Html5Qrcode('qr-reader')
  qrRef.current = scanner
  let started = false

  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: 250 },
    (decoded) => {
      setUrlInput(decoded)
      setTab('url')
      setShowQR(false)
    },
    undefined
  ).then(() => {
    started = true
  }).catch((err) => {
    console.warn('QR start failed:', err)
  })

  return () => {
    if (started) {
      scanner.stop().catch(() => {})
    } else {
      // scanner didn't start yet, wait a bit then stop
      setTimeout(() => {
        scanner.stop().catch(() => {})
      }, 500)
    }
  }
}, [showQR])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const runLoadingCycle = () => {
    let i = 0
    setLoadingMsg(LOADING_MSGS[0])
    const interval = setInterval(() => {
      i++
      if (i < LOADING_MSGS.length) setLoadingMsg(LOADING_MSGS[i])
      else clearInterval(interval)
    }, 700)
    return interval
  }

  const scan = async () => {
  setError(null)
  setResult(null)
  setLoading(true)
  const interval = runLoadingCycle()

  // ✅ guard — user is always defined here because of the sign-in wall above
  if (!user) {
    setError('You must be signed in to scan.')
    setLoading(false)
    clearInterval(interval)
    return
  }

  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const token = await user.getIdToken()
    const authHeader = { 'Authorization': `Bearer ${token}` }

    if (tab === 'text') {
      if (!textInput.trim()) { setError('Please enter some text to analyze.'); setLoading(false); clearInterval(interval); return }
      const res = await fetch(`${API}/api/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },  // ✅ added
        body: JSON.stringify({ text: textInput }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResult(data)
      try {
        const id = await saveScan('text', textInput, {
          risk_score: data.risk_score, risk_level: data.risk_level,
          red_flags: data.red_flags, explanation: data.explanation,
          recommendations: data.recommendations,
        }, user.uid)
        setSavedId(id)
      } catch (e) { console.warn('Firebase save failed:', e) }

    } else if (tab === 'image') {
      if (!imageFile) { setError('Please upload an image.'); setLoading(false); clearInterval(interval); return }
      const form = new FormData()
      form.append('file', imageFile)
      const res = await fetch(`${API}/api/analyze/image`, {
        method: 'POST',
        headers: { ...authHeader },  // ✅ added (no Content-Type for FormData)
        body: form,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResult(data)
      try {
        const id = await saveScan('image', imageFile.name, {
          risk_score: data.risk_score, risk_level: data.risk_level,
          red_flags: data.red_flags, explanation: data.explanation,
          recommendations: data.recommendations,
          extracted_text: data.extracted_text,
        }, user.uid)
        setSavedId(id)
      } catch (e) { console.warn('Firebase save failed:', e) }

    } else {
      if (!urlInput.trim()) { setError('Please enter a URL to analyze.'); setLoading(false); clearInterval(interval); return }
      const res = await fetch(`${API}/api/analyze/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },  // ✅ added
        body: JSON.stringify({ url: urlInput }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResult(data)
      try {
        const id = await saveScan('url', urlInput, {
          risk_score: data.risk_score, risk_level: data.risk_level,
          red_flags: data.red_flags, explanation: data.explanation,
          recommendations: data.recommendations,
        }, user.uid)
        setSavedId(id)
      } catch (e) { console.warn('Firebase save failed:', e) }
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    setError(`Analysis failed: ${msg}. Make sure your backend is running.`)
  } finally {
    clearInterval(interval)
    setLoading(false)
  }
}

  const riskConfig = result?.risk_level ? RISK_CONFIG[result.risk_level] : null
  const scorePercent = result?.risk_score ?? 0

  // ── Auth loading ──────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Initializing...</span>
    </div>
  )

  // ── Sign-in wall ──────────────────────────────────────────────
  if (!user) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 20, padding: 24,
    }}>
      <div style={{ fontSize: 48 }}>🛡️</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, textAlign: 'center' }}>
        Sign in to TruthShield
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
        Your scans are saved privately to your account. Sign in to continue.
      </p>
      <button
        onClick={signInWithGoogle}
        disabled={authLoading}
        style={{
          background: 'var(--cyan)', color: '#000', border: 'none',
          borderRadius: 10, padding: '14px 36px', fontSize: 15,
          fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 0 24px rgba(0,212,255,0.3)',
        }}
      >
        Sign in with Google
      </button>
    </div>
  )

  // ── Main UI ───────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36, animation: 'fadeUp 0.5s ease both' }}>
          <p style={{ color: 'var(--cyan)', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 2, marginBottom: 8 }}>
            // THREAT_SCANNER
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 8 }}>
            Scan for Threats
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Submit text, image, or URL — get instant AI analysis with explanations.
          </p>
          {/* Signed-in user */}
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            Signed in as {user.email}
          </p>
        </div>

        {/* Input Panel */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden', marginBottom: 24,
          animation: 'fadeUp 0.5s ease 0.1s both',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['text', 'image', 'url'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setResult(null); setError(null); setShowQR(false) }} style={{
                flex: 1, padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t ? 'var(--cyan)' : 'var(--text3)',
                borderBottom: tab === t ? '2px solid var(--cyan)' : '2px solid transparent',
                fontFamily: 'var(--font-mono)', fontSize: 13,
                transition: 'all 0.2s',
              }}>
                {t === 'text' && '[ TEXT ]'}
                {t === 'image' && '[ IMAGE / OCR ]'}
                {t === 'url' && '[ URL ]'}
              </button>
            ))}
          </div>

          {/* Input body */}
          <div style={{ padding: 24 }}>
            {tab === 'text' && (
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Paste suspicious message, email, or text here..."
                rows={7}
                style={{
                  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '14px 16px', color: 'var(--text)',
                  fontFamily: 'var(--font-mono)', fontSize: 13, resize: 'vertical',
                  outline: 'none', lineHeight: 1.7, transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            )}

            {tab === 'image' && (
              <div>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${imageFile ? 'var(--cyan)' : 'var(--border2)'}`,
                    borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                    background: imageFile ? 'rgba(0,212,255,0.04)' : 'var(--bg3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                  ) : (
                    <div>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
                      <p style={{ color: 'var(--text2)', fontSize: 13 }}>
                        Drop an image here or <span style={{ color: 'var(--cyan)' }}>click to browse</span>
                      </p>
                      <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 6 }}>JPG, PNG — OCR will extract text automatically</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                {imageFile && (
                  <p style={{ color: 'var(--text2)', fontSize: 12, marginTop: 10 }}>
                    📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                    <button onClick={() => { setImageFile(null); setImagePreview(null) }} style={{
                      marginLeft: 10, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12,
                    }}>✕ Remove</button>
                  </p>
                )}
              </div>
            )}

            {tab === 'url' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <span style={{
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRight: 'none',
                    borderRadius: '10px 0 0 10px', padding: '12px 16px', color: 'var(--text3)', fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                  }}>URL</span>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://suspicious-link.com/offer"
                    style={{
                      flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: '0 10px 10px 0', padding: '12px 16px', color: 'var(--text)',
                      fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 10 }}>
                  Checked against VirusTotal + Google Safe Browsing + AI analysis
                </p>

                {/* QR Button */}
                <button onClick={() => setShowQR(v => !v)} style={{
                  marginTop: 12, background: 'none', border: '1px solid var(--cyan)',
                  color: 'var(--cyan)', padding: '8px 18px', borderRadius: 8,
                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
                }}>
                  {showQR ? '✕ Cancel QR Scan' : '📷 Scan QR Code'}
                </button>

                {/* QR Reader div */}
                {showQR && (
                  <div style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div id="qr-reader" style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            )}

            {/* Scan button */}
            <button
              onClick={scan}
              disabled={loading}
              style={{
                marginTop: 20, width: '100%', padding: '14px',
                background: loading ? 'rgba(0,212,255,0.1)' : 'var(--cyan)',
                color: loading ? 'var(--cyan)' : '#000',
                border: loading ? '1px solid rgba(0,212,255,0.3)' : 'none',
                borderRadius: 10, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,212,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid var(--cyan)',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  }} />
                  {loadingMsg}
                </>
              ) : (
                '⚡ Analyze Content'
              )}
            </button>

            {error && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 8,
                background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.3)',
                color: 'var(--red)', fontSize: 13,
              }}>
                ⚠ {error}
              </div>
            )}
          </div>
        </div>

        {/* RESULTS */}
        {result && riskConfig && (
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>

            {/* Risk badge */}
            <div style={{
              background: riskConfig.bg, border: `1px solid ${riskConfig.border}`,
              borderRadius: 16, padding: '28px 28px 20px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
                  color: riskConfig.color, letterSpacing: 2,
                }}>
                  {result.risk_level === 'safe' ? '✅' : result.risk_level === 'suspicious' ? '⚠️' : '🚨'}&nbsp;
                  {riskConfig.label}
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 24, color: riskConfig.color, fontWeight: 700 }}>
                  {result.risk_score}<span style={{ fontSize: 14, opacity: 0.6 }}>/100</span>
                </div>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${scorePercent}%`,
                  background: riskConfig.color, borderRadius: 4,
                  boxShadow: `0 0 10px ${riskConfig.color}`,
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--text3)', fontSize: 11 }}>
                <span>0 — Safe</span><span>50 — Suspicious</span><span>100 — Dangerous</span>
              </div>
            </div>

            {/* OCR extracted text */}
            {result.extracted_text && (
              <div style={{
                background: 'var(--panel)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '20px 24px', marginBottom: 20,
              }}>
                <p style={{ color: 'var(--amber)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 10, letterSpacing: 1 }}>
                  // OCR_EXTRACTED_TEXT
                </p>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {result.extracted_text}
                </p>
              </div>
            )}

            {/* Red flags */}
            {result.red_flags?.length > 0 && (
              <div style={{
                background: 'var(--panel)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '20px 24px', marginBottom: 20,
              }}>
                <p style={{ color: 'var(--red)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 14, letterSpacing: 1 }}>
                  // RED_FLAGS_DETECTED ({result.red_flags.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.red_flags.map((flag, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(255,59,59,0.06)', border: '1px solid rgba(255,59,59,0.15)',
                    }}>
                      <span style={{ color: 'var(--red)', marginTop: 1 }}>▸</span>
                      <span style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '20px 24px', marginBottom: 20,
            }}>
              <p style={{ color: 'var(--cyan)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 12, letterSpacing: 1 }}>
                // AI_EXPLANATION
              </p>
              <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.8 }}>{result.explanation}</p>
            </div>

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div style={{
                background: 'var(--panel)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '20px 24px',
              }}>
                <p style={{ color: 'var(--green)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 14, letterSpacing: 1 }}>
                  // RECOMMENDED_ACTIONS
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)',
                    }}>
                      <span style={{ color: 'var(--green)', marginTop: 1 }}>✓</span>
                      <span style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scan again */}
            <button onClick={() => { setResult(null); setError(null) }} style={{
              marginTop: 20, background: 'none', border: '1px solid var(--border2)',
              color: 'var(--text2)', padding: '10px 24px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, width: '100%',
            }}>
              ↺ Scan Something Else
            </button>
          </div>
        )}
      </div>
    </div>
  )
}