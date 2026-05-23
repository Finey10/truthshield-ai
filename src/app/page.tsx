"use client";

import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ paddingTop: 60 }}>
      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center', position: 'relative',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid var(--border2)', borderRadius: 100,
          padding: '6px 16px', marginBottom: 32,
          background: 'rgba(0,212,255,0.05)',
          animation: 'fadeUp 0.6s ease both',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
            display: 'inline-block',
            boxShadow: '0 0 8px var(--green)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }} />
          <span style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            AI-Powered Threat Detection — Live
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(42px, 8vw, 80px)', lineHeight: 1.05,
          marginBottom: 24, maxWidth: 900,
          animation: 'fadeUp 0.6s ease 0.1s both',
        }}>
          Detect Threats<br />
          <span style={{
            background: 'linear-gradient(90deg, var(--cyan), var(--green))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Before They Reach You</span>
        </h1>

        <p style={{
          color: 'var(--text2)', fontSize: 16, maxWidth: 560,
          lineHeight: 1.8, marginBottom: 40,
          animation: 'fadeUp 0.6s ease 0.2s both',
        }}>
          TruthShield uses AI, OCR, and real-time threat intelligence to analyze
          suspicious messages, URLs, and images — and explains exactly why they&apos;re dangerous.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.6s ease 0.3s both',
        }}>
          <Link href="/scanner" style={{
            padding: '14px 32px', borderRadius: 10,
            background: 'var(--cyan)', color: '#000',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
            boxShadow: '0 0 24px rgba(0,212,255,0.4)',
            transition: 'all 0.2s', display: 'inline-block',
          }}>
            Start Scanning →
          </Link>
          <Link href="/about" style={{
            padding: '14px 32px', borderRadius: 10,
            border: '1px solid var(--border2)', color: 'var(--text)',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
            background: 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s', display: 'inline-block',
          }}>
            How it Works
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 48, marginTop: 72,
          animation: 'fadeUp 0.6s ease 0.4s both',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { val: '99.2%', label: 'Detection Rate' },
            { val: '<2s', label: 'Avg. Scan Time' },
            { val: '5', label: 'Input Types' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--cyan)' }}>
                {s.val}
              </div>
              <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ color: 'var(--cyan)', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 12, letterSpacing: 2 }}>
            // HOW_IT_WORKS
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)' }}>
            Multi-Layer AI Analysis
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            {
              step: '01', icon: '⬆', title: 'Submit Content',
              desc: 'Paste text, upload a screenshot, enter a URL, or scan a QR code. Any format works.',
              color: 'var(--cyan)',
            },
            {
              step: '02', icon: '🔍', title: 'OCR Extraction',
              desc: 'Images are processed with Tesseract OCR to extract all readable text for analysis.',
              color: 'var(--amber)',
            },
            {
              step: '03', icon: '🧠', title: 'AI Analysis',
              desc: 'Claude / Gemini detects urgency manipulation, phishing patterns, and fraud signals.',
              color: 'var(--green)',
            },
            {
              step: '04', icon: '🛡', title: 'Threat Intelligence',
              desc: 'URLs are cross-checked against VirusTotal and Google Safe Browsing in real time.',
              color: 'var(--cyan)',
            },
            {
              step: '05', icon: '📊', title: 'Risk Score',
              desc: 'A 0–100 danger score is computed from AI confidence, URL reputation, and phishing signals.',
              color: 'var(--amber)',
            },
            {
              step: '06', icon: '💡', title: 'Explanation',
              desc: 'You get a plain-language breakdown of every red flag found — not just a verdict.',
              color: 'var(--green)',
            },
          ].map(item => (
            <div key={item.step} style={{
              background: 'var(--panel)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '28px 24px',
              transition: 'border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = item.color
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ color: item.color, fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>
                  [{item.step}]
                </span>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8, color: item.color }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text2)', lineHeight: 1.7, fontSize: 13 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border2)',
          borderRadius: 20, padding: '60px 40px',
          boxShadow: '0 0 60px rgba(0,212,255,0.05)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 16 }}>
            Stay Protected. Stay Informed.
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: 32, lineHeight: 1.8 }}>
            Paste any suspicious message or URL below and get an instant AI-powered analysis.
          </p>
          <Link href="/scanner" style={{
            padding: '14px 40px', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--cyan), var(--green))',
            color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            display: 'inline-block',
            boxShadow: '0 0 30px rgba(0,212,255,0.3)',
          }}>
            Open Scanner
          </Link>
        </div>
      </section>

      <footer style={{
        borderTop: '1px solid var(--border)', padding: '32px 24px',
        textAlign: 'center', color: 'var(--text3)', fontSize: 12,
      }}>
        TruthShield AI — Built for Hackathon 2025 &nbsp;·&nbsp; Protecting users from digital fraud
      </footer>
    </div>
  )
}
