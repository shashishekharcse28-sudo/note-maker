"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ─── Title persistence ────────────────────────────────────────────────────────
const TITLE_STORAGE_KEY = "studyos-doc-title";

// ─── Logo mark ───────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-label="StudyOS logo"
    >
      <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
      <path
        d="M8 10h8M8 14h12M8 18h6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="21" cy="10" r="2.5" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Status dot (shows "Live" editing state) ─────────────────────────────────
function LiveDot() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "0.72rem",
        color: "#86efac",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#22c55e",
          boxShadow: "0 0 0 3px rgba(34,197,94,0.25)",
          display: "inline-block",
          animation: "pulse 2s infinite",
        }}
      />
      <style>{`@keyframes pulse {
        0%,100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.25); }
        50%      { box-shadow: 0 0 0 5px rgba(34,197,94,0.1); }
      }`}</style>
      Autosaved
    </span>
  );
}

// ─── Nav icon button ─────────────────────────────────────────────────────────
interface NavIconBtnProps {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}
function NavIconBtn({ title, children, onClick }: NavIconBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.05)",
        color: "#a0a0c0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
        fontSize: "1rem",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(99,102,241,0.18)";
        (e.currentTarget as HTMLButtonElement).style.color = "#a5b4fc";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(99,102,241,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLButtonElement).style.color = "#a0a0c0";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(255,255,255,0.08)";
      }}
    >
      {children}
    </button>
  );
}

// ─── NavBar ──────────────────────────────────────────────────────────────────
interface NavBarProps {
  documentTitle?: string;
}

export default function NavBar({ documentTitle = "Untitled Document" }: NavBarProps) {
  const [title, setTitle] = useState(() => {
    if (typeof window === "undefined") return documentTitle;
    try {
      const saved = localStorage.getItem(TITLE_STORAGE_KEY);
      return saved || documentTitle;
    } catch { return documentTitle; }
  });

  // Sync title to browser tab and localStorage
  useEffect(() => {
    document.title = `${title} — StudyOS`;
    localStorage.setItem(TITLE_STORAGE_KEY, title);
  }, [title]);

  return (
    <nav
      className="navbar-glass"
      style={{
        height: "52px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "16px",
        flexShrink: 0,
        zIndex: 50,
        position: "relative",
      }}
      aria-label="Main navigation"
    >
      {/* Logo + brand */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <LogoMark />
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "#e2e2ef",
            letterSpacing: "0em",
          }}
        >
          Study<span style={{ color: "#818cf8" }}>OS</span>
        </span>
      </Link>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "22px",
          background: "rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      />

      {/* Document title (editable + persisted) */}
      <input
        type="text"
        value={title}
        aria-label="Document title"
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#c8c8e8",
          fontSize: "1.05rem",
          fontFamily: "'Caveat', cursive",
          fontWeight: 500,
          maxWidth: "260px",
          flex: 1,
          cursor: "text",
          minWidth: 0,
        }}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={(e) => {
          e.currentTarget.style.color = "#e2e2ef";
        }}
        onBlur={(e) => {
          e.currentTarget.style.color = "#c8c8e8";
          // Clean up empty titles
          if (!title.trim()) setTitle("Untitled Document");
        }}
      />

      <LiveDot />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Mode badge */}
      <span className="mode-pill" aria-label="Current view mode">
        Split View
      </span>

      {/* Action buttons */}
      <NavIconBtn title="Keyboard shortcuts">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M8 15h8" />
        </svg>
      </NavIconBtn>

      <NavIconBtn title="Export document">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 15V3M7 8l5-5 5 5M20 15v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4" />
        </svg>
      </NavIconBtn>

      <NavIconBtn title="Settings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </NavIconBtn>

      {/* Avatar placeholder */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "0.8rem",
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 0 0 2px rgba(99,102,241,0.4)",
        }}
        aria-label="User avatar"
        role="button"
        tabIndex={0}
      >
        U
      </div>
    </nav>
  );
}
