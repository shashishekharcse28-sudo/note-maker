"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { convertAIToCanvas } from "@/lib/layout-engine";

// ─── Note style options ────────────────────────────────────────────────────────
const STYLES = [
  { id: "colorful" as const, emoji: "🎨", label: "Colorful", desc: "Vibrant callouts & highlights" },
  { id: "clean"    as const, emoji: "📝", label: "Clean",    desc: "Minimal & professional" },
  { id: "academic" as const, emoji: "🎓", label: "Academic", desc: "Formal & structured" },
  { id: "dark"     as const, emoji: "🌙", label: "Dark Study", desc: "Easy on the eyes" },
] as const;

type NoteStyle = (typeof STYLES)[number]["id"];

export default function PastePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [style, setStyle]     = useState<NoteStyle>("colorful");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 150);
  }, []);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      setError("");
    } catch {
      setError("Could not read clipboard. Please paste manually (Ctrl+V).");
    }
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError("Please paste some content first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      
      const elements = convertAIToCanvas(data.data);
      localStorage.setItem("studyos-ai-excalidraw", JSON.stringify(elements));
      
      router.push("/canvas");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate notes");
      setLoading(false);
    }
  };

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, #0f0f13 55%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px 40px",
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40%            { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .paste-page-card { animation: fadeUp 0.45s ease both; }
        .style-btn:hover  { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }
        .nav-link:hover   { color: #a5b4fc !important; }
      `}</style>

      {/* ── Hero Header ── */}
      <div style={{ textAlign: "center", marginBottom: "32px", animation: "fadeUp 0.35s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#pg-logo-grad)" />
            <path d="M8 10h8M8 14h12M8 18h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="10" r="2.5" fill="white" opacity="0.9" />
            <defs>
              <linearGradient id="pg-logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: "1.75rem", color: "#e2e2ef" }}>
            Study<span style={{ color: "#818cf8" }}>OS</span>
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: "clamp(1.6rem, 4vw, 2.5rem)", fontWeight: 800, color: "#e2e2ef", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
          Paste anything.{" "}
          <span style={{ background: "linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Get beautiful notes.
          </span>
        </h1>
        <p style={{ margin: "10px 0 0", color: "#6b6b9a", fontSize: "1rem", fontFamily: "'Inter', sans-serif" }}>
          Paste from ChatGPT, Gemini, Claude — we&apos;ll structure it into stunning study notes.
        </p>
      </div>

      {/* ── Main Card ── */}
      <div className="paste-page-card" style={{
        width: "100%",
        maxWidth: "700px",
        background: "linear-gradient(145deg, #1a1a2e 0%, #16162a 50%, #1e1e38 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: "20px",
        boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}>

        {/* ── Textarea ── */}
        <div style={{ padding: "24px 24px 0", position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(""); }}
            disabled={loading}
            placeholder={"Paste your AI-generated content here...\n\nExample: Copy the response from ChatGPT about 'What is Photosynthesis?' and paste it here. We'll transform it into stunning study notes!"}
            style={{
              width: "100%",
              minHeight: "220px",
              maxHeight: "40vh",
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: "12px",
              padding: "16px",
              color: "#d0d0e8",
              fontSize: "0.9rem",
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.2s",
              display: "block",
            }}
            onFocus={(e)  => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)"; }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; }}
          />
          {!content && !loading && (
            <button
              onClick={handlePasteFromClipboard}
              style={{
                position: "absolute", bottom: "16px", right: "40px",
                padding: "7px 14px", borderRadius: "8px",
                border: "1px solid rgba(99,102,241,0.3)",
                background: "rgba(99,102,241,0.12)", color: "#a5b4fc",
                fontSize: "0.78rem", fontFamily: "'Inter', sans-serif",
                fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.22)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
            >
              📋 Paste from Clipboard
            </button>
          )}
        </div>

        {/* Word/char count */}
        <div style={{ padding: "6px 24px 0", display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#5a5a7a", fontFamily: "'Inter', sans-serif" }}>
          <span>{wordCount} words · {charCount.toLocaleString()} characters</span>
          {charCount > 40000 && <span style={{ color: "#ef4444" }}>⚠ Near character limit</span>}
        </div>

        {/* ── Style Selector ── */}
        <div style={{ padding: "16px 24px 0" }}>
          <p style={{ fontSize: "0.72rem", color: "#7a7a9a", fontFamily: "'Inter', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Note Style
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {STYLES.map((s) => (
              <button
                key={s.id}
                className="style-btn"
                onClick={() => setStyle(s.id)}
                disabled={loading}
                style={{
                  padding: "10px 6px", borderRadius: "10px",
                  border: style === s.id ? "1.5px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  background: style === s.id ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                  cursor: loading ? "default" : "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{s.emoji}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: style === s.id ? "#a5b4fc" : "#9a9ab8", fontFamily: "'Inter', sans-serif" }}>{s.label}</span>
                <span style={{ fontSize: "0.62rem", color: "#5a5a7a", fontFamily: "'Inter', sans-serif", textAlign: "center", lineHeight: 1.3 }}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ margin: "12px 24px 0", padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: "0.8rem", fontFamily: "'Inter', sans-serif" }}>
            {error}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            style={{
              width: "100%", padding: "13px 28px", borderRadius: "12px", border: "none",
              background: loading
                ? "linear-gradient(90deg, #4f46e5, #7c3aed, #6366f1, #4f46e5)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              backgroundSize: loading ? "300% 100%" : "100% 100%",
              animation: loading ? "shimmer 2s linear infinite" : "none",
              color: "#fff", fontSize: "0.95rem", fontFamily: "'Inter', sans-serif",
              fontWeight: 700, cursor: loading || !content.trim() ? "default" : "pointer",
              opacity: !content.trim() && !loading ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: loading ? "none" : "0 4px 24px rgba(99,102,241,0.4)",
              transition: "opacity 0.15s, box-shadow 0.15s",
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "flex", gap: "4px" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%", background: "#fff", display: "inline-block",
                      animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite both`,
                    }} />
                  ))}
                </span>
                Generating your notes…
              </>
            ) : (
              <>✨ Generate Notes</>
            )}
          </button>

          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/canvas" className="nav-link" style={{ fontSize: "0.82rem", color: "#6b6b9a", fontFamily: "'Inter', sans-serif", textDecoration: "none", transition: "color 0.15s" }}>
              Or go straight to Canvas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
