'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRecentScans, auth, type ScanRecord } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'

const RISK_COLORS = {
  safe: 'var(--green)',
  suspicious: 'var(--amber)',
  dangerous: 'var(--red)',
}

function fmtDate(ts: Timestamp | null): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function HistoryPage() {
  const [records, setRecords] = useState<ScanRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'safe' | 'suspicious' | 'dangerous'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  // Fetch scans once user is known
  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    getRecentScans(user.uid, 50)
      .then(data => setRecords(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const fetchScans = () => {
    if (!user) return
    setLoading(true)
    setError(null)
    getRecentScans(user.uid, 50)
      .then(data => setRecords(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  const filtered = filter === 'all' ? records : records.filter(r => r.risk_level === filter)

  // ── Auth loading ──────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Initializing...</span>
    </div>
  )

  // ── Not signed in ─────────────────────────────────────────────
  if (!user) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 20, padding: 24,
    }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>
        Sign in to view history
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
        Your scan history is private and linked to your account.
      </p>
      <Link href="/scanner" style={{
        background: 'var(--cyan)', color: '#000', padding: '12px 32px',
        borderRadius: 10, fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 14, textDecoration: 'none',
      }}>
        Go to Scanner →
      </Link>
    </div>
  )

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div style={{ marginBottom: 36, animation: 'fadeUp 0.5s ease both' }}>
          <p style={{ color: 'var(--cyan)', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
            // SCAN_HISTORY · FIRESTORE
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 8 }}>
            Past Analyses
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            All your previous scans, saved to Firebase Firestore.
          </p>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            Signed in as {user.email}
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['all', 'dangerous', 'suspicious', 'safe'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 8, border: '1px solid',
              borderColor: filter === f ? (f === 'all' ? 'var(--cyan)' : RISK_COLORS[f] ?? 'var(--cyan)') : 'var(--border)',
              background: filter === f ? (f === 'all' ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.1)') : 'transparent',
              color: filter === f ? (f === 'all' ? 'var(--cyan)' : RISK_COLORS[f] ?? 'var(--cyan)') : 'var(--text3)',
              cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
              transition: 'all 0.2s',
            }}>
              {f.toUpperCase()}
              <span style={{ marginLeft: 6, opacity: 0.6 }}>
                ({f === 'all' ? records.length : records.filter(r => r.risk_level === f).length})
              </span>
            </button>
          ))}

          {/* Refresh button */}
          <button
            onClick={fetchScans}
            style={{
              marginLeft: 'auto', padding: '7px 14px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text3)', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 12,
            }}
          >
            ↺ Refresh
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '60px 0', color: 'var(--text3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          }}>
            <span style={{
              width: 20, height: 20, border: '2px solid var(--cyan)',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', display: 'inline-block',
            }} />
            Loading from Firestore…
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{
            padding: '20px 24px', borderRadius: 12,
            background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.3)',
            color: 'var(--red)', fontSize: 13,
          }}>
            ⚠ {error}
            <br />
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>
              Check that your Firebase config is correct in src/lib/firebase.ts
            </span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 0', color: 'var(--text3)',
            border: '1px dashed var(--border)', borderRadius: 14,
          }}>
            No scans found.{' '}
            <Link href="/scanner" style={{ color: 'var(--cyan)' }}>Run your first scan →</Link>
          </div>
        )}

        {/* Records list */}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((r, i) => (
              <div key={r.id} style={{
                background: 'var(--panel)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '18px 22px',
                display: 'flex', alignItems: 'center', gap: 20,
                animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = RISK_COLORS[r.risk_level])}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Type icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {r.input_type === 'text' ? '📄' : r.input_type === 'image' ? '🖼' : '🔗'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: 'var(--text)', fontSize: 13, marginBottom: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.snippet}
                  </p>
                  <p style={{ color: 'var(--text3)', fontSize: 11 }}>
                    {r.input_type.toUpperCase()} · {fmtDate(r.created_at)}
                  </p>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
                    color: RISK_COLORS[r.risk_level],
                  }}>
                    {r.risk_score}
                  </div>
                  <div style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)',
                    color: RISK_COLORS[r.risk_level], opacity: 0.8, letterSpacing: 1,
                  }}>
                    {r.risk_level.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}