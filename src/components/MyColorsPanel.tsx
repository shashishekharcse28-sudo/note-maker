"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";

const DEFAULT_COLORS = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f08c00"];

function EyedropperIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.84 4.61a4.243 4.243 0 00-6-6l-9 9-3 1 1 3 9 9a4.243 4.243 0 006-6l2-2a1 1 0 000-1.41z" />
    </svg>
  );
}

interface Props { excalidrawAPI: any | null; }

export default function MyColorsPanel({ excalidrawAPI }: Props) {
  const [colors, setColors] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COLORS;
    try { const s = localStorage.getItem("studyos-my-colors"); return s ? JSON.parse(s) : DEFAULT_COLORS; }
    catch { return DEFAULT_COLORS; }
  });
  const [showPicker, setShowPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState("#6366f1");
  const [hexInput, setHexInput] = useState("#6366f1");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Persist colors
  useEffect(() => { localStorage.setItem("studyos-my-colors", JSON.stringify(colors)); }, [colors]);
  useEffect(() => { setHexInput(pickerColor); }, [pickerColor]);

  // Dynamically set CSS variable for panel height so Excalidraw panel can stitch underneath it
  useEffect(() => {
    if (!panelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].borderBoxSize[0]?.blockSize || entries[0].contentRect.height;
      document.documentElement.style.setProperty("--my-colors-panel-height", `${height}px`);
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const h = (e: MouseEvent) => {
      if (pickerRef.current?.contains(e.target as Node)) return;
      if (addBtnRef.current?.contains(e.target as Node)) return;
      setShowPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showPicker]);

  // ── Bidirectional color sync ───────────────────────────────────────────────
  useEffect(() => {
    if (!excalidrawAPI) return;

    const sync = () => {
      try {
        const appState = excalidrawAPI.getAppState();
        const elements = excalidrawAPI.getSceneElements();
        const { selectedElementIds, currentItemStrokeColor } = appState;
        const selectedKeys = Object.keys(selectedElementIds || {});
        let stroke = currentItemStrokeColor as string;

        if (selectedKeys.length > 0) {
          const el = elements.find((e: any) => selectedElementIds[e.id]);
          if (el?.strokeColor) stroke = el.strokeColor;
        }

        const norm = stroke?.toLowerCase();
        if (norm && colors.map(c => c.toLowerCase()).includes(norm)) {
          setActiveColor(norm);
        } else {
          setActiveColor(null);
        }
      } catch {}
    };

    sync();
    const interval = setInterval(sync, 150);
    const unsubscribe = excalidrawAPI.onChange(sync);
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [excalidrawAPI, colors]);

  // ── Apply color ─────────────────────────────────────────────────────────────
  const applyColor = useCallback((color: string) => {
    setActiveColor(color.toLowerCase());
    if (!excalidrawAPI) return;
    
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const { selectedElementIds } = appState;
    const hasSel = Object.keys(selectedElementIds || {}).length > 0;
    
    // Pass elements to force Excalidraw UI to re-render
    excalidrawAPI.updateScene({
      appState: { currentItemStrokeColor: color },
      elements: hasSel
        ? (elements as any[]).map(el => selectedElementIds[el.id] ? { ...el, strokeColor: color } : el)
        : elements,
    });
  }, [excalidrawAPI]);

  const handleHexInput = (v: string) => { setHexInput(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) setPickerColor(v); };
  const addColor = () => { const c = pickerColor.toLowerCase(); if (!colors.includes(c)) setColors(p => [...p, c]); setShowPicker(false); };
  const removeColor = (i: number) => { setColors(p => p.filter((_, j) => j !== i)); if (hoveredIdx === i) setHoveredIdx(null); };

  return (
    <>
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          top: "4rem", // Align perfectly with Excalidraw panels
          left: "1rem", // Fixed 4px gap to match Excalidraw left offset
          zIndex: 15,
          userSelect: "none",
          background: "var(--island-bg-color, #ffffff)",
          padding: "0.75rem 0.75rem 10px",
          width: "12.5rem", // Matches .App-menu__left exact width
          boxSizing: "border-box",
          border: "1px solid var(--color-surface-mid, rgba(0,0,0,0.07))",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: "none",
          boxShadow: "var(--shadow-island, 0 1px 5px rgba(0,0,0,.15))",
          clipPath: "inset(-20px -20px 0 -20px)", // Hides the bottom shadow to create a seamless joint
        }}
      >
        <div style={{ paddingBottom: 10, marginBottom: 4, borderBottom: "1px solid var(--color-surface-mid, rgba(0,0,0,0.09))" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-on-surface-low, #868e96)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7, fontFamily: "Assistant, system-ui, sans-serif" }}>
            My Colors
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
            {colors.map((color, i) => {
              const norm = color.toLowerCase();
              const isActive = activeColor === norm;
              return (
                <div key={`${color}-${i}`} style={{ position: "relative" }} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                  <button onClick={() => applyColor(color)} title={`Apply ${color}`}
                    style={{
                      width: 22, height: 22, borderRadius: 4, background: color,
                      border: color.toLowerCase() === "#ffffff" ? "1.5px solid rgba(0,0,0,0.25)" : "1.5px solid rgba(0,0,0,0.12)",
                      cursor: "pointer", padding: 0, display: "block", boxSizing: "border-box",
                      transition: "transform 0.12s, box-shadow 0.12s",
                      transform: hoveredIdx === i ? "scale(1.18)" : "scale(1)",
                      boxShadow: isActive ? "0 0 0 2px #fff, 0 0 0 3.5px rgba(0,0,0,0.85)" : "none",
                    }} />
                  {hoveredIdx === i && (
                    <button onClick={e => { e.stopPropagation(); removeColor(i); }} title="Remove"
                      style={{ position: "absolute", top: -5, right: -5, width: 13, height: 13, borderRadius: "50%", background: "#ff4444", color: "white", border: "none", cursor: "pointer", fontSize: "0.55rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, padding: 0 }}>
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            <button ref={addBtnRef} onClick={() => setShowPicker(v => !v)} title="Add colour"
              style={{ width: 22, height: 22, borderRadius: 4, background: "conic-gradient(from 0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)", border: showPicker ? "2px solid #6366f1" : "1.5px solid rgba(0,0,0,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0, boxSizing: "border-box" }}>
              <span style={{ color: "white", fontSize: "0.85rem", fontWeight: 800, textShadow: "0 0 3px rgba(0,0,0,0.7)", lineHeight: 1 }}>+</span>
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <div ref={pickerRef} style={{ position: "absolute", top: "calc(4rem + 95px)", left: "0.75rem", background: "#1a1a1a", borderRadius: 14, padding: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.45)", width: 232, zIndex: 9999 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 700 }}>Pen Color</span>
            <EyedropperIcon />
          </div>
          <HexColorPicker color={pickerColor} onChange={setPickerColor} style={{ width: "100%", height: 140 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: pickerColor, border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
            <input value={hexInput} onChange={e => handleHexInput(e.target.value)} spellCheck={false}
              style={{ flex: 1, background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 7, color: "#e0e0e0", padding: "5px 8px", fontSize: "0.78rem", fontFamily: "monospace", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#3a3a3a")} />
            <button onClick={addColor} style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 10, paddingTop: 10, borderTop: "1px solid #2e2e2e" }}>
            {["#ff4444","#ff8800","#ffdd00","#44cc44","#2299ff","#aa44ff","#ffffff","#000000"].map(c => (
              <button key={c} onClick={() => setPickerColor(c)}
                style={{ width: 20, height: 20, borderRadius: 4, background: c, border: pickerColor === c ? "2px solid #6366f1" : "1.5px solid rgba(255,255,255,0.15)", cursor: "pointer", padding: 0 }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
