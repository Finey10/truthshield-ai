import Link from 'next/link'

export default function AboutPage() {
  const stack = [
    { layer: 'Frontend', tech: 'Next.js 14 + TypeScript', detail: 'App Router, server components, Tailwind', color: 'var(--cyan)' },
    { layer: 'Backend', tech: 'FastAPI (Python)', detail: 'Async REST API, modular service architecture', color: 'var(--amber)' },
    { layer: 'OCR', tech: 'Tesseract via pytesseract', detail: 'Extracts text from images/screenshots', color: 'var(--green)' },
    { layer: 'AI Engine', tech: 'Claude / Gemini API', detail: 'NLP scam detection + explainable output', color: 'var(--cyan)' },
    { layer: 'Threat APIs', tech: 'VirusTotal + Google Safe Browsing', detail: 'Real-time URL reputation check', color: 'var(--amber)' },
    { layer: 'Database', tech: 'Firebase Firestore', detail: 'Scan history, logs, user data', color: 'var(--green)' },
    { layer: 'Deployment', tech: 'Vercel + Render', detail: 'Frontend on Vercel, backend on Render', color: 'var(--cyan)' },
  ]

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 72, animation: 'fadeUp 0.5s ease both' }}>
          <p style={{ color: 'var(--cyan)', fontSize: 11, letterSpacing: 2, marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
            // ABOUT_TRUTHSHIELD
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', marginBottom: 20 }}>
            Built to Protect<br />
            <span style={{ color: 'var(--cyan)' }}>Everyday Users</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.8 }}>
            TruthShield AI combines artificial intelligence, OCR, and real-time threat intelligence
            into a single accessible platform — and explains every result in plain language.
          </p>
        </div>

        {/* Mission */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '36px 40px', marginBottom: 60,
          animation: 'fadeUp 0.5s ease 0.1s both',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 16, color: 'var(--green)' }}>
            Why We Built This
          </h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.9, fontSize: 14, marginBottom: 16 }}>
            Traditional spam filters just say &quot;spam&quot; — they don&apos;t explain <em>why</em>. Students, elderly users,
            and non-technical people get hit hardest by phishing and scams because they can&apos;t recognise the signals.
          </p>
          <p style={{ color: 'var(--text2)', lineHeight: 1.9, fontSize: 14 }}>
            TruthShield goes further: it detects threats AND teaches users what to look for, building
            long-term cybersecurity awareness with every scan.
          </p>
        </div>

        {/* Tech stack */}
        <div style={{ marginBottom: 60, animation: 'fadeUp 0.5s ease 0.2s both' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, marginBottom: 28 }}>
            Technology Stack
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stack.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
                alignItems: 'center', gap: 20,
                padding: '16px 20px', borderRadius: 10,
                background: i % 2 === 0 ? 'var(--panel)' : 'var(--bg3)',
                border: '1px solid var(--border)',
              }}>
                <span style={{ color: s.color, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                  {s.layer.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                  {s.tech}
                </span>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>{s.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk score legend */}
        <div style={{ marginBottom: 60, animation: 'fadeUp 0.5s ease 0.3s both' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, marginBottom: 24 }}>
            Risk Score Breakdown
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { range: '0 – 30', label: 'Safe', color: 'var(--green)', bg: 'rgba(0,255,135,0.07)', border: 'rgba(0,255,135,0.25)', desc: 'No significant threats detected. Content appears legitimate.' },
              { range: '31 – 70', label: 'Suspicious', color: 'var(--amber)', bg: 'rgba(255,184,0,0.07)', border: 'rgba(255,184,0,0.25)', desc: 'Some red flags present. Proceed with caution and verify manually.' },
              { range: '71 – 100', label: 'Dangerous', color: 'var(--red)', bg: 'rgba(255,59,59,0.07)', border: 'rgba(255,59,59,0.25)', desc: 'High probability of phishing or scam. Do not interact.' },
            ].map(r => (
              <div key={r.label} style={{
                background: r.bg, border: `1px solid ${r.border}`,
                borderRadius: 14, padding: '24px 20px',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: r.color, marginBottom: 4 }}>
                  {r.range}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: r.color, marginBottom: 10 }}>
                  {r.label}
                </div>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease 0.4s both' }}>
          <Link href="/scanner" style={{
            padding: '14px 40px', borderRadius: 10,
            background: 'var(--cyan)', color: '#000',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
            display: 'inline-block',
            boxShadow: '0 0 24px rgba(0,212,255,0.3)',
          }}>
            Try the Scanner →
          </Link>
        </div>
      </div>
    </div>
  )
}
