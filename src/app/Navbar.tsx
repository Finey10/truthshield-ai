'use client';
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { auth, signInWithGoogle, logOut } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

export default function Navbar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const links = [
    { href: '/', label: 'Home' },
    { href: '/scanner', label: 'Scanner' },
    { href: '/history', label: 'History' },
    { href: '/about', label: 'About' },
  ]

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u))
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(8,12,16,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image
            src="/logo.png"
            alt="TruthShield"
            width={32}
            height={32}
            priority
          />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
            Truth<span style={{ color: 'var(--cyan)' }}>Shield</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 8 }} className="nav-links">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: '6px 14px', borderRadius: 6,
              color: path === l.href ? 'var(--cyan)' : 'var(--text2)',
              background: path === l.href ? 'rgba(0,212,255,0.08)' : 'transparent',
              border: path === l.href ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
              fontSize: 13, fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s',
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Avatar */}
            {user.photoURL && (
              <img
                src={user.photoURL}
                referrerPolicy="no-referrer"
                alt="avatar"
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '2px solid var(--cyan)',
                  objectFit: 'cover',
                }}
              />
            )}
            {/* Email (hidden on small screens via inline style) */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text3)', maxWidth: 140,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.email}
            </span>
            {/* Sign out */}
            <button
              onClick={logOut}
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text2)', padding: '6px 14px', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
                transition: 'all 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--red)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: 'var(--cyan)', color: '#000',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              border: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 16px rgba(0,212,255,0.3)',
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  )
}