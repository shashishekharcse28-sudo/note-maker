"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const ExcalidrawCanvas = dynamic(() => import("@/components/ExcalidrawCanvas"), {
  ssr: false,
});

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", background: "var(--paper-bg)", color: "#a0a0b8",
      fontFamily: "'Inter', sans-serif", fontSize: "0.85rem",
    }}>
      Loading editor…
    </div>
  ),
});

// ─── Persistence keys ─────────────────────────────────────────────────────────
const STORAGE_KEY = "studyos-split-ratio";
const DEFAULT_RATIO = 0.6; // 60% canvas, 40% editor
const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;

// ─── Split View ───────────────────────────────────────────────────────────────
export default function SplitView() {
  const [ratio, setRatio] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_RATIO;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= MIN_RATIO && val <= MAX_RATIO) return val;
      }
    } catch {}
    return DEFAULT_RATIO;
  });

  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Persist ratio
  useEffect(() => {
    if (!editorCollapsed) {
      localStorage.setItem(STORAGE_KEY, ratio.toString());
    }
  }, [ratio, editorCollapsed]);

  // ── Drag handler ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startRatio = ratio;

    const container = (e.target as HTMLElement).parentElement;
    if (!container) return;
    const containerWidth = container.getBoundingClientRect().width;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const newRatio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, startRatio + delta / containerWidth));
      setRatio(newRatio);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [ratio]);

  // ── Double-click to collapse/expand ─────────────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    setEditorCollapsed(prev => !prev);
  }, []);

  const effectiveRatio = editorCollapsed ? 1.0 : ratio;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        height: "100%",
        width: "100%",
        position: "relative",
      }}
    >
      {/* ── Left Panel: Excalidraw Canvas ── */}
      <div
        style={{
          width: `${effectiveRatio * 100}%`,
          height: "100%",
          overflow: "hidden",
          position: "relative",
          background: "#ffffff",
          transition: isDragging ? "none" : "width 0.25s ease",
          flexShrink: 0,
        }}
      >
        <ExcalidrawCanvas />
      </div>

      {/* ── Resize Handle ── */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        tabIndex={0}
        title={editorCollapsed ? "Double-click to expand editor" : "Drag to resize · Double-click to collapse"}
        style={{
          width: "5px",
          flexShrink: 0,
          cursor: "col-resize",
          background: isDragging ? "rgba(99,102,241,0.4)" : "var(--surface-border)",
          transition: isDragging ? "none" : "background 0.2s",
          position: "relative",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isDragging) e.currentTarget.style.background = "rgba(99,102,241,0.4)";
        }}
        onMouseLeave={(e) => {
          if (!isDragging) e.currentTarget.style.background = "var(--surface-border)";
        }}
      >
        {/* Center nub indicator */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "2px",
            height: "40px",
            borderRadius: "99px",
            background: isDragging ? "rgba(99,102,241,1)" : "rgba(99,102,241,0.5)",
            transition: "opacity 0.2s, background 0.2s",
            opacity: isDragging ? 1 : 0,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Right Panel: TipTap Editor ── */}
      <div
        style={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
          position: "relative",
          background: "var(--paper-bg)",
          transition: isDragging ? "none" : "flex 0.25s ease",
          display: editorCollapsed ? "none" : "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <TipTapEditor />
      </div>
    </div>
  );
}
