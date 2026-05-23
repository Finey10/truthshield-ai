import type { Metadata } from 'next'
import './globals.css'
import Navbar from './Navbar'

export const metadata: Metadata = {
  title: 'TruthShield AI — Cybersecurity & Scam Detection',
  description: 'AI-powered platform to detect phishing, scams, fake news, and malicious URLs in real time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
