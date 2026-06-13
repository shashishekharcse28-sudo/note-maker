"use client";

import { useState, useRef, useEffect } from "react";

// ─── Note style options ──────────────────────────────────────────────────────
const STYLES = [
  { id: "colorful" as const, emoji: "🎨", label: "Colorful", desc: "Vibrant callouts & highlights" },
  { id: "clean" as const, emoji: "📝", label: "Clean", desc: "Minimal & professional" },
  { id: "academic" as const, emoji: "🎓", label: "Academic", desc: "Formal & structured" },
  { id: "dark" as const, emoji: "🌙", label: "Dark Study", desc: "Easy on the eyes" },
] as const;

type NoteStyle = (typeof STYLES)[number]["id"];

interface PasteModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (html: string) => void;
}

export default function PasteModal({ open, onClose, onGenerated }: PasteModalProps) {
  const [content, setContent] = useState("");
  const [style, setStyle] = useState<NoteStyle>("colorful");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onClose]);

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
      const res = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), style }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      onGenerated(data.html);
      setContent("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "modalFadeIn 0.25s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #16162a 50%, #1e1e38 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "20px",
          width: "min(680px, 92vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation: "modalSlideUp 0.35s ease",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "24px 28px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            ✨
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#e2e2ef",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Generate Beautiful Notes
            </h2>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "0.8rem",
                color: "#7a7a9a",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Paste content from ChatGPT, Gemini, or any source
            </p>
          </div>
          <button
            onClick={() => !loading && onClose()}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#888",
              cursor: loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              transition: "all 0.15s",
              opacity: loading ? 0.4 : 1,
            }}
            disabled={loading}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Textarea ── */}
        <div style={{ padding: "16px 28px 0", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", flex: 1, minHeight: "200px" }}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError("");
              }}
              disabled={loading}
              placeholder="Paste your AI-generated content here...

Example: Copy the response from ChatGPT about 'What is Photosynthesis?' and paste it here. We'll transform it into stunning study notes!"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "200px",
                maxHeight: "35vh",
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
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)";
              }}
            />
            {/* Paste from clipboard button */}
            {!content && !loading && (
              <button
                onClick={handlePasteFromClipboard}
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.12)",
                  color: "#a5b4fc",
                  fontSize: "0.78rem",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.22)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                }}
              >
                📋 Paste from Clipboard
              </button>
            )}
          </div>

          {/* Word/char count */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              fontSize: "0.72rem",
              color: "#5a5a7a",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span>{wordCount} words · {charCount.toLocaleString()} characters</span>
            {charCount > 40000 && (
              <span style={{ color: "#ef4444" }}>⚠ Near character limit</span>
            )}
          </div>
        </div>

        {/* ── Style Selector ── */}
        <div style={{ padding: "0 28px 16px" }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#7a7a9a",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            Note Style
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                disabled={loading}
                style={{
                  padding: "10px 6px",
                  borderRadius: "10px",
                  border: style === s.id
                    ? "1.5px solid rgba(99,102,241,0.6)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: style === s.id
                    ? "rgba(99,102,241,0.12)"
                    : "rgba(255,255,255,0.03)",
                  cursor: loading ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (style !== s.id && !loading) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (style !== s.id) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{s.emoji}</span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: style === s.id ? "#a5b4fc" : "#9a9ab8",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: "#5a5a7a",
                    fontFamily: "'Inter', sans-serif",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {s.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              margin: "0 28px 12px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
              fontSize: "0.8rem",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px 28px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#9a9ab8",
              fontSize: "0.85rem",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              cursor: loading ? "default" : "pointer",
              transition: "all 0.15s",
              opacity: loading ? 0.4 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            style={{
              padding: "10px 28px",
              borderRadius: "10px",
              border: "none",
              background: loading
                ? "linear-gradient(90deg, #4f46e5, #7c3aed, #6366f1, #4f46e5)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              backgroundSize: loading ? "300% 100%" : "100% 100%",
              animation: loading ? "shimmer 2s linear infinite" : "none",
              color: "#fff",
              fontSize: "0.85rem",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              cursor: loading || !content.trim() ? "default" : "pointer",
              transition: "all 0.15s",
              opacity: !content.trim() && !loading ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "flex", gap: "4px" }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#fff",
                        display: "inline-block",
                        animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite both`,
                      }}
                    />
                  ))}
                </span>
                Generating...
              </>
            ) : (
              <>✨ Generate Notes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
