"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";

const DEFAULT_COLORS = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f08c00"];

function EyedropperIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 0 0 5 16v3h3a2 2 0 0 0 1.42-.59l6.6-6.6 1.41 1.42 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 0-1.42z" />
    </svg>
  );
}

const FountainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/>
    <circle cx="11" cy="11" r="2"/>
  </svg>
);

const BallPenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    <path d="M15 5l4 4"/>
  </svg>
);

const BrushIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
  </svg>
);

const HighlighterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.22 4.97l3.81 3.81-9.9 9.9a2 2 0 01-1 .54l-3.54.71.71-3.54a2 2 0 01.54-1l9.38-10.42z"/>
    <path d="M18 2l4 4-2 2-4-4 2-2z"/>
    <rect x="2" y="20" width="10" height="3" rx="1" fill="currentColor" opacity="0.25"/>
  </svg>
);

interface Props { excalidrawAPI: any | null; isCustomShapeActive?: boolean; }

export default function MyColorsPanel({ excalidrawAPI, isCustomShapeActive }: Props) {
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

  const [penType, setPenType] = useState<"fountain" | "ball" | "brush" | "highlighter">("fountain");
  const [tipSharpness, setTipSharpness] = useState(50);
  const [pressureSens, setPressureSens] = useState(50);
  const [stabilization, setStabilization] = useState(0);
  const [isPenActive, setIsPenActive] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [isShapeToolActive, setIsShapeToolActive] = useState(false);
  const [isSelectionActive, setIsSelectionActive] = useState(false); // ← CHANGED: track selection tool

  // Expose pen settings to window
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).activePenType = (isShapeToolActive || isCustomShapeActive) ? "none" : penType;
      (window as any).penSettings = { tipSharpness, pressureSens, stabilization };
    }
  }, [penType, tipSharpness, pressureSens, stabilization, isShapeToolActive, isCustomShapeActive]);


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
      // Defer state updates until AFTER Excalidraw finishes its current render cycle.
      // Calling setState synchronously during Excalidraw's onChange triggers React's
      // "Cannot update a component while rendering a different component" warning.
      setTimeout(() => {
        try {
          const appState = excalidrawAPI.getAppState();
          const elements = excalidrawAPI.getSceneElements();
          const { selectedElementIds, currentItemStrokeColor, activeTool } = appState;
          
          setIsPenActive(activeTool?.type === "freedraw");
          const eraser = activeTool?.type === "eraser";
          setIsEraserActive(eraser);
          if (eraser) setShowPicker(false);

          // nav tool awareness — only hide when nav + nothing selected.
          // When elements ARE selected (e.g. just finished drawing a shape),
          // keep the panel visible so MY COLORS remains accessible.
          const isNavTool = activeTool?.type === "selection" || activeTool?.type === "hand";
          const hasSelectedElements = Object.keys(selectedElementIds || {}).length > 0;
          const shouldHideForNav = isNavTool && !hasSelectedElements;
          setIsSelectionActive(shouldHideForNav);
          if (shouldHideForNav) setShowPicker(false);

          const SHAPE_TOOLS = new Set([
            "rectangle","ellipse","diamond","arrow","line",
            "text","image","frame","embeddable","laser"
          ]);
          // Pen Type stays hidden for shape tools AND for nav tools (even with selection),
          // so we never show fountain/ball/brush options in editing mode.
          const isShape = SHAPE_TOOLS.has(activeTool?.type) || isNavTool;
          setIsShapeToolActive(isShape);
          
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
      }, 0);
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


  const handleEyedropper = async () => {
    if (typeof window === "undefined" || !("EyeDropper" in window)) {
      alert("Eyedropper is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex.toLowerCase();
      setPickerColor(hex);
      setHexInput(hex);
    } catch {
      // user cancelled — do nothing
    }
  };

  return (
    <>
      <style>{`
        .studyos-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          outline: none;
          margin: 0;
          padding: 0;
        }
        .studyos-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4b5563;
          cursor: pointer;
          border: none;
        }

        /* ── react-colorful overrides ── */
        .studyos-picker .react-colorful {
          width: 100%;
          height: auto;
          gap: 0;
          border-radius: 0;
        }
        .studyos-picker .react-colorful__saturation {
          border-radius: 8px 8px 0 0;
          height: 160px;
          flex-shrink: 0;
        }
        .studyos-picker .react-colorful__hue {
          height: 14px;
          border-radius: 0 0 8px 8px;
          margin-top: 0;
          border-top: 2px solid #111;
        }
        .studyos-picker .react-colorful__pointer {
          width: 20px;
          height: 20px;
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 0 1.5px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.5);
        }
        .studyos-picker .react-colorful__hue-pointer {
          width: 18px;
          height: 18px;
        }
        .studyos-picker .react-colorful__saturation-pointer {
          width: 20px;
          height: 20px;
        }
        .studyos-hex-input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.18);
        }
      `}</style>
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
          display: (isEraserActive || isSelectionActive) ? "none" : undefined, // ← CHANGED: also hide on selection
        }}
      >

        {/* ── COLORS + PEN TYPE — shown when eraser is NOT active ── */}
        {!isEraserActive && (<>
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

        {/* ── PEN TYPE SECTION ── */}
        {!isShapeToolActive && !isCustomShapeActive && (
        <div style={{ paddingTop: 6 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-on-surface-low, #868e96)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7, fontFamily: "Assistant, system-ui, sans-serif" }}>
            Pen Type
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "fountain", label: "Fountain", icon: <FountainIcon /> },
              { id: "ball", label: "Ball Pen", icon: <BallPenIcon /> },
              { id: "brush", label: "Brush", icon: <BrushIcon /> },
              { id: "highlighter", label: "Highlight", icon: <HighlighterIcon /> },
            ].map(pen => (
              <button
                key={pen.id}
                onClick={() => setPenType(pen.id as any)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 2px 6px",
                  borderRadius: "6px",
                  background: penType === pen.id ? "#efedff" : "transparent",
                  border: penType === pen.id ? "1px solid #6366f1" : "1px solid transparent",
                  color: penType === pen.id ? "#6366f1" : "var(--color-on-surface-low, #868e96)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {pen.icon}
                <span style={{ fontSize: "0.6rem", marginTop: 4, fontWeight: penType === pen.id ? 600 : 500 }}>{pen.label}</span>
              </button>
            ))}
          </div>

          <div style={{
            display: "grid",
            gridTemplateRows: isPenActive ? "1fr" : "0fr",
            transition: "all 0.3s ease",
            opacity: isPenActive ? 1 : 0,
          }}>
            <div style={{ overflow: "hidden" }}>
              <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px solid var(--color-surface-mid, rgba(0,0,0,0.09))" }}>
                {[
                  { label: "Tip Sharp", val: tipSharpness, set: setTipSharpness, show: penType === 'fountain' },
                  { label: "Pressure", val: pressureSens, set: setPressureSens, show: penType === 'fountain' || penType === 'brush' },
                  { label: "Stabilize", val: stabilization, set: setStabilization, show: penType !== 'highlighter' },
                ].map(s => s.show && (
                  <div key={s.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--color-on-surface-low, #868e96)", width: 55 }}>{s.label}</span>
                      <input type="range" min="0" max="100" value={s.val} onChange={e => s.set(Number(e.target.value))} className="studyos-slider" style={{ flex: 1 }} />
                      <span style={{ fontSize: "0.65rem", color: "var(--color-on-surface-low, #868e96)", width: 20, textAlign: "right", fontWeight: 600 }}>{s.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
        </>)}
      </div>

      {showPicker && (
        <div
          ref={pickerRef}
          className="studyos-picker"
          style={{
            position: "absolute",
            top: "calc(4rem + 95px)",
            left: "0.75rem",
            background: "#161618",
            borderRadius: 16,
            padding: "14px 14px 12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            width: 240,
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{
              color: "#f0f0f0",
              fontSize: "0.82rem",
              fontWeight: 700,
              fontFamily: "'Inter', system-ui, sans-serif",
              letterSpacing: "0.01em",
            }}>Change Color</span>
            <button
              title="Pick color from screen"
              onClick={handleEyedropper}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: 2, display: "flex", alignItems: "center", borderRadius: 4, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e0e0e0")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888")}
            >
              <EyedropperIcon />
            </button>
          </div>

          {/* Gradient + hue slider */}
          <HexColorPicker color={pickerColor} onChange={setPickerColor} style={{ width: "100%" }} />

          {/* Hex input row */}
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              background: "#252528",
              border: "1px solid #333336",
              borderRadius: 8,
              padding: "0 10px",
              height: 34,
              gap: 8,
            }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: pickerColor,
                border: "2px solid rgba(255,255,255,0.22)",
                flexShrink: 0,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              }} />
              <input
                value={hexInput}
                onChange={e => handleHexInput(e.target.value)}
                spellCheck={false}
                className="studyos-hex-input"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#d0d0d4",
                  fontSize: "0.8rem",
                  fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
                  letterSpacing: "0.04em",
                  padding: 0,
                  minWidth: 0,
                }}
              />
            </div>
            <button
              onClick={addColor}
              title="Add to palette"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#4f6ef7",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "1.25rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "transform 0.12s, box-shadow 0.12s",
                boxShadow: "0 2px 8px rgba(79,110,247,0.45)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,110,247,0.6)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(79,110,247,0.45)";
              }}
            >+</button>
          </div>
        </div>
      )}
    </>
  );
}
