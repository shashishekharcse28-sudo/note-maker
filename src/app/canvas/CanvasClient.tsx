"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const ExcalidrawCanvas = dynamic(() => import("@/components/ExcalidrawCanvas"), { ssr: false });

// ─── Logo ────────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="StudyOS logo">
      <rect width="28" height="28" rx="8" fill="url(#cv-logo-grad)" />
      <path d="M8 10h8M8 14h12M8 18h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="21" cy="10" r="2.5" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="cv-logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────────
interface NavBtnProps { href: string; children: React.ReactNode; primary?: boolean; }
function NavBtn({ href, children, primary }: NavBtnProps) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: primary ? "7px 16px" : "7px 14px",
      borderRadius: "8px",
      border: primary ? "none" : "1px solid rgba(255,255,255,0.08)",
      background: primary ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)",
      color: primary ? "#fff" : "#a0a0c0",
      fontSize: "0.8rem", fontFamily: "'Inter', sans-serif", fontWeight: 600,
      textDecoration: "none", cursor: "pointer", transition: "all 0.15s",
      boxShadow: primary ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
      whiteSpace: "nowrap",
    }}>
      {children}
    </Link>
  );
}

export default function CanvasClient() {
  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--surface-0)" }}>
      {/* ── Canvas NavBar ── */}
      <nav className="navbar-glass" style={{
        height: "52px", display: "flex", alignItems: "center",
        padding: "0 20px", gap: "14px", flexShrink: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          <LogoMark />
          <span style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: "1.2rem", color: "#e2e2ef" }}>
            Study<span style={{ color: "#818cf8" }}>OS</span>
          </span>
        </Link>

        <div style={{ width: "1px", height: "22px", background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

        <span style={{ fontFamily: "'Caveat', cursive", color: "#c8c8e8", fontSize: "1rem", fontWeight: 500 }}>
          Canvas
        </span>

        <div style={{ flex: 1 }} />

        <NavBtn href="/" primary>✨ New from AI</NavBtn>
      </nav>

      {/* ── Full-screen Canvas ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        <ExcalidrawCanvas />
      </div>
    </main>
  );
}
