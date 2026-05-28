"use client";

import dynamic from "next/dynamic";
import { Group, Panel, Separator } from "react-resizable-panels";

// TipTap must be client-only (uses browser APIs)
const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        flex: 1,
        background: "var(--paper-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#b0b0cc",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.875rem",
      }}
    >
      Loading editor…
    </div>
  ),
});

const ExcalidrawCanvas = dynamic(() => import("@/components/ExcalidrawCanvas"), {
  ssr: false,
});

// ─── Panel header strip ──────────────────────────────────────────────────────
interface PanelHeaderProps {
  icon: React.ReactNode;
  label: string;
  side: "notes" | "canvas";
}

function PanelHeader({ icon, label, side }: PanelHeaderProps) {
  const accentColor = side === "notes" ? "#6366f1" : "#8b5cf6";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 16px",
        background: side === "notes" ? "#efeff8" : "#f0f0f7",
        borderBottom:
          side === "notes"
            ? "1px solid #e0dff5"
            : "1px solid #ddddf0",
        flexShrink: 0,
      }}
    >
      <span style={{ color: accentColor, display: "flex" }}>{icon}</span>
      <span
        style={{
          fontSize: "0.72rem",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: side === "notes" ? "#7878a8" : "#7070a8",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Icon helpers ────────────────────────────────────────────────────────────
function NoteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function CanvasIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 17l4-4 4 4M7 12l3-3 4 4" />
    </svg>
  );
}

// ─── Split View ──────────────────────────────────────────────────────────────
export default function SplitView() {
  return (
    <Group
      direction="horizontal"
      style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0, height: "100%" }}
      id="main-split"
    >
      {/* ── Left: Notes panel ── */}
      <Panel
        id="notes-panel"
        defaultSize={50}
        minSize={25}
        maxSize={75}
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div className="panel-anim" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <PanelHeader icon={<NoteIcon />} label="Notes" side="notes" />
          <TipTapEditor />
        </div>
      </Panel>

      {/* ── Resize handle ── */}
      <Separator id="resize-handle" aria-label="Resize panels" />

      {/* ── Right: Canvas panel ── */}
      <Panel
        id="canvas-panel"
        defaultSize={50}
        minSize={25}
        maxSize={75}
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div
          className="panel-anim"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "#ffffff",
            animationDelay: "0.08s",
          }}
        >
          <PanelHeader icon={<CanvasIcon />} label="Whiteboard" side="canvas" />
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <ExcalidrawCanvas />
          </div>
        </div>
      </Panel>
    </Group>
  );
}
