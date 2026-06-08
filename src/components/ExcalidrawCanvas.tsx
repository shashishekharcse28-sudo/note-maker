"use client";

import "@excalidraw/excalidraw/index.css";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import MyColorsPanel from "./MyColorsPanel";
import { LIBRARY_ITEMS } from "./studyShapeLibrary.js";

// Dashed: uniform evenly-spaced horizontal dashes — clean and symmetrical
const DASHED_SVG = `<svg width="14" height="14" viewBox="0 0 20 20">
  <rect x="1" y="1" width="18" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="4" y1="6"  x2="9"  y2="6"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="6" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="4" y1="10" x2="9"  y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="4" y1="14" x2="9"  y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const ZIGZAG_SVG = `<svg width="14" height="14" viewBox="0 0 20 20">
  <rect x="1" y="1" width="18" height="18" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
  <polyline points="3,8 7,5 11,8 15,5 19,8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
  <polyline points="3,13 7,10 11,13 15,10 19,13" fill="none" stroke="currentColor" strokeWidth="1.5"/>
</svg>`;

// ─── More-Shapes tool definitions ────────────────────────────────────────────
const MORE_SHAPES = [
  { name: "triangle",      label: "Triangle",      icon: "△" },
  { name: "roundedRect",   label: "Rounded Rect",  icon: "▢" },
  { name: "parallelogram", label: "Parallelogram",  icon: "▱" },
  { name: "trapezoid",     label: "Trapezoid",      icon: "⏢" },
  { name: "stadium",       label: "Stadium",        icon: "⬭" },
  { name: "cross",         label: "Cross",          icon: "✚" },
  { name: "pentagon",      label: "Pentagon",       icon: "⬠" },
  { name: "hexagon",       label: "Hexagon",        icon: "⬡" },
] as const;

type ShapeName = (typeof MORE_SHAPES)[number]["name"];

// ─── Element factory ──────────────────────────────────────────────────────────
function makeBase(
  id: string,
  strokeColor: string,
  backgroundColor: string,
  strokeWidth: number,
  strokeStyle: string,
  roughness: number,
  fillStyle: string // ← CHANGED: added fillStyle parameter
) {
  return {
    angle: 0,
    strokeColor,
    backgroundColor,
    fillStyle: fillStyle as any, // ← CHANGED: supports "solid"|"hachure"|"cross-hatch"|"dots"|"zigzag"
    strokeWidth,
    strokeStyle,
    roughness,
    opacity: 100,
    frameId: null,
    link: null,
    locked: false,
    seed: 11111,
    version: 1,
    versionNonce: 22222,
    isDeleted: false,
    updated: Date.now(),
  };
}

// NOTE: buildLineGroup / buildPolygon removed — see buildShapeElement comment below.

// KEY DESIGN: every polygon is ONE line element with a closed points[] rather
// than N separate grouped line segments.
//
// WHY: Excalidraw resizes a *group* by repositioning each member element
// independently. The line segments drift — the triangle "falls apart" on resize.
// A SINGLE element with multiple points is resized as one unit: Excalidraw
// scales width & height and all points are interpolated proportionally.
function buildShapeElement(
  shapeName: ShapeName,
  x: number, y: number, w: number, h: number,
  strokeColor: string,
  backgroundColor: string,
  strokeWidth: number,
  strokeStyle: string,
  roughness: number,
  fillStyle: string, // ← CHANGED: added fillStyle parameter
  existingId?: string
): object | object[] | null {
  const id = existingId ?? crypto.randomUUID();
  const base = makeBase(id, strokeColor, backgroundColor, strokeWidth, strokeStyle, roughness, fillStyle); // ← CHANGED: pass fillStyle

  // Single closed-polygon line element. Points are RELATIVE to (x, y).
  // Excalidraw requires the first point to be exactly [0, 0].
  const makePoly = (pts: [number, number][]) => {
    const startX = pts[0][0];
    const startY = pts[0][1];
    
    const normalizedPts = pts.map(p => [p[0] - startX, p[1] - startY] as [number, number]);
    normalizedPts.push([0, 0]); // close the polygon

    // Accurately calculate the bounding box of the normalized points.
    // Excalidraw's rough.js fill depends on `width` and `height` exactly matching the points' span.
    // If they don't match, the hachure/cross-hatch fill will bleed outside the stroke mask.
    const minX = Math.min(...normalizedPts.map(p => p[0]));
    const minY = Math.min(...normalizedPts.map(p => p[1]));
    const maxX = Math.max(...normalizedPts.map(p => p[0]));
    const maxY = Math.max(...normalizedPts.map(p => p[1]));

    return {
      ...base, id,
      type: "line" as const,
      x: x + startX, 
      y: y + startY, 
      width: maxX - minX, 
      height: maxY - minY,
      points: normalizedPts,
      groupIds: [],
      roundness: null,
    };
  };

  // Regular N-gon vertices inscribed in the w x h bounding box.
  const regularPts = (sides: number, startAngle: number): [number, number][] =>
    Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * Math.PI * 2 + startAngle;
      return [(w / 2) + (w / 2) * Math.cos(a), (h / 2) + (h / 2) * Math.sin(a)] as [number, number];
    });

  switch (shapeName) {
    case "roundedRect":
      return {
        ...base, id, type: "rectangle", x, y, width: w, height: h,
        groupIds: [],
        roundness: { type: 3, value: Math.min(w, h) * 0.15 },
      };

    case "stadium":
      return {
        ...base, id, type: "rectangle", x, y, width: w, height: h,
        groupIds: [],
        roundness: { type: 3, value: h / 2 },
      };

    case "triangle":
      return makePoly([[w / 2, 0], [w, h], [0, h]]);

    case "parallelogram": {
      const sk = w * 0.2;
      return makePoly([[sk, 0], [w, 0], [w - sk, h], [0, h]]);
    }

    case "trapezoid": {
      const ins = w * 0.18;
      return makePoly([[ins, 0], [w - ins, 0], [w, h], [0, h]]);
    }

    case "pentagon":
      return makePoly(regularPts(5, -Math.PI / 2));

    case "hexagon":
      return makePoly(regularPts(6, 0));

    case "cross": {
      // Cross must stay as two rectangles — can't be a single line polygon
      const t = w * 0.3;
      const groupId = id + "-group";
      return [
        { ...base, id: id + "-v", type: "rectangle",
          x: x + w / 2 - t / 2, y,             width: t, height: h, groupIds: [groupId], roundness: null },
        { ...base, id: id + "-h", type: "rectangle",
          x,                     y: y + h / 2 - t / 2, width: w, height: t, groupIds: [groupId], roundness: null },
      ];
    }

    default:
      return null;
  }
}

function flatElements(result: object | object[] | null): any[] {
  if (!result) return [];
  return (Array.isArray(result) ? result.flat() : [result]) as any[];
}

// ─── Lasso Math ───────────────────────────────────────────────────────────────
// Ray-casting: count crossings of a horizontal ray from (px,py) rightward.
function pointInPolygon(px: number, py: number, poly: [number,number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// Cross product of vectors OA and OB.
function cross2d(ox: number, oy: number, ax: number, ay: number, bx: number, by: number): number {
  return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
}

// Segment AB on segment CD overlap test (collinear case).
function onSeg(ax: number, ay: number, bx: number, by: number, px: number, py: number): boolean {
  return Math.min(ax, bx) <= px && px <= Math.max(ax, bx) &&
         Math.min(ay, by) <= py && py <= Math.max(ay, by);
}

// Proper + degenerate segment intersection.
function segsIntersect(
  a1x: number, a1y: number, a2x: number, a2y: number,
  b1x: number, b1y: number, b2x: number, b2y: number
): boolean {
  const d1 = cross2d(b1x, b1y, b2x, b2y, a1x, a1y);
  const d2 = cross2d(b1x, b1y, b2x, b2y, a2x, a2y);
  const d3 = cross2d(a1x, a1y, a2x, a2y, b1x, b1y);
  const d4 = cross2d(a1x, a1y, a2x, a2y, b2x, b2y);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  if (d1 === 0 && onSeg(b1x, b1y, b2x, b2y, a1x, a1y)) return true;
  if (d2 === 0 && onSeg(b1x, b1y, b2x, b2y, a2x, a2y)) return true;
  if (d3 === 0 && onSeg(a1x, a1y, a2x, a2y, b1x, b1y)) return true;
  if (d4 === 0 && onSeg(a1x, a1y, a2x, a2y, b2x, b2y)) return true;
  return false;
}

// Full AABB ↔ polygon intersection:
// Selects element if: any AABB corner is inside lasso OR
//                     any lasso vertex is inside AABB OR
//                     any lasso edge crosses any AABB edge.
function elementIntersectsLasso(el: any, lasso: [number,number][]): boolean {
  if (lasso.length < 3) return false;
  const x  = el.x  ?? 0;
  const y  = el.y  ?? 0;
  const w  = Math.max(el.width  ?? 0, 1);
  const h  = Math.max(el.height ?? 0, 1);

  const corners: [number,number][] = [
    [x, y], [x + w, y], [x + w, y + h], [x, y + h],
  ];

  // 1. Any AABB corner inside lasso
  if (corners.some(([cx, cy]) => pointInPolygon(cx, cy, lasso))) return true;

  // 2. Any lasso vertex inside AABB
  if (lasso.some(([lx, ly]) => lx >= x && lx <= x + w && ly >= y && ly <= y + h)) return true;

  // 3. Any lasso edge crosses any AABB edge
  const boxEdges = [
    [corners[0], corners[1]], [corners[1], corners[2]],
    [corners[2], corners[3]], [corners[3], corners[0]],
  ] as [[number,number],[number,number]][];

  for (let i = 0; i < lasso.length; i++) {
    const [p1x, p1y] = lasso[i];
    const [p2x, p2y] = lasso[(i + 1) % lasso.length];
    for (const [[e1x, e1y], [e2x, e2y]] of boxEdges) {
      if (segsIntersect(p1x, p1y, p2x, p2y, e1x, e1y, e2x, e2y)) return true;
    }
  }

  return false;
}

// ─── Screen → Scene coordinate conversion ────────────────────────────────────
function screenToScene(
  clientX: number,
  clientY: number,
  canvas: HTMLElement,
  api: any
): { x: number; y: number } {
  const rect     = canvas.getBoundingClientRect();
  const appState = api.getAppState();
  const zoom     = appState.zoom.value;
  const scrollX  = appState.scrollX;
  const scrollY  = appState.scrollY;
  return {
    x: (clientX - rect.left) / zoom - scrollX / zoom,
    y: (clientY - rect.top)  / zoom - scrollY / zoom,
  };
}

// ─── More Shapes Dropdown ─────────────────────────────────────────────────────
// Rendered via renderTopRightUI — lives INSIDE Excalidraw's toolbar.
// Uses position:fixed + getBoundingClientRect so the palette always escapes
// Excalidraw's internal overflow clipping and renders below the button.
function MoreShapesButton({
  activeTool,
  onSelect,
}: {
  activeTool: ShapeName | null;
  onSelect: (name: ShapeName) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Open: calculate fixed position from button rect so it clears Excalidraw's overflow
  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
    setOpen((o) => !o);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const isActive = MORE_SHAPES.some((s) => s.name === activeTool);

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        ref={btnRef}
        title="More shapes"
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 8,
          border: isActive ? "2px solid #6366f1" : "1.5px solid rgba(0,0,0,0.10)",
          background: isActive ? "#ede9fe" : "#fff",
          cursor: "pointer",
          fontSize: 18,
          color: isActive ? "#6366f1" : "#374151",
          boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        ⊞
      </button>

      {open && dropdownPos && (
        // Fixed positioning escapes Excalidraw's internal overflow:hidden containers
        <div
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            transform: "translateX(-50%)",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 8,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 4,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 99999,
            minWidth: 220,
          }}
        >
          {MORE_SHAPES.map((s) => (
            <button
              key={s.name}
              title={s.label}
              onClick={() => { onSelect(s.name); setOpen(false); }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "8px 4px",
                border: activeTool === s.name
                  ? "1px solid #6366f1"
                  : "1px solid transparent",
                borderRadius: 8,
                background: activeTool === s.name ? "#ede9fe" : "transparent",
                cursor: "pointer",
                fontSize: 20,
                gap: 2,
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                if (activeTool !== s.name) {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTool !== s.name) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <span>{s.icon}</span>
              <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lasso Button ─────────────────────────────────────────────────────────────
function LassoButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      title="Lasso select"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: 8,
        border: active ? "2px solid #6366f1" : "1.5px solid rgba(0,0,0,0.10)",
        background: active ? "#ede9fe" : "#fff",
        cursor: "pointer",
        color: active ? "#6366f1" : "#374151",
        boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
        transition: "all 0.15s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 9.5C4.5 5.91 7.41 3 11 3c3.31 0 6 2.46 6.4 5.65" strokeDasharray="3 2"/>
        <path d="M17.5 9.5c1.5 0.5 3 2 3 4.5 0 3-2.5 5-5.5 6-2 .67-4.5.5-6-.5"/>
        <path d="M4.5 9.5C3 10 2 11.5 2 13c0 2.5 2 4.5 4.5 5.5"/>
        <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/>
      </svg>
    </button>
  );
}

// ─── Dynamic import of Excalidraw ─────────────────────────────────────────────
// Caveat custom font ID — must be > 8 (IDs 1–8 are Excalidraw built-ins)
const CAVEAT_ID = 5000;

const ExcalidrawWithMenu = dynamic(
  async () => {
    const { Excalidraw, MainMenu } = await import("@excalidraw/excalidraw");
    function Canvas(props: any) {
      return (
        <Excalidraw {...props}>
          <MainMenu>
            <MainMenu.DefaultItems.LoadScene />
            <MainMenu.DefaultItems.SaveToActiveFile />
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.Separator />
            <MainMenu.DefaultItems.ToggleTheme />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
        </Excalidraw>
      );
    }
    return Canvas;
  },
  {
    ssr: false,
    loading: () => (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", color: "#6366f1", flexDirection: "column", gap: "12px" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ animation: "ex-spin 1.2s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <style>{`@keyframes ex-spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "0.8rem", color: "#888", fontFamily: "Inter, sans-serif" }}>Loading canvas…</span>
      </div>
    ),
  }
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function ExcalidrawCanvas() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // UI state — drives button highlight only
  const [activeCustomTool, setActiveCustomTool] = useState<ShapeName | null>(null);

  // ── Lasso state ─────────────────────────────────────────────────────────────
  const [isLassoActive, setIsLassoActive] = useState(false);
  const isLassoRef      = useRef(false);
  const lassoDrawingRef = useRef(false);
  const lassoPointsRef  = useRef<[number,number][]>([]);
  const lassoSvgRef     = useRef<SVGSVGElement>(null);
  const lassoPathRef    = useRef<SVGPathElement>(null);
  const lassoFillRef    = useRef<SVGPathElement>(null);

  // ── Uniform-dots canvas overlay ──────────────────────────────────────────
  // Maps elId → intended dot color (stored when user clicks Dots button,
  // because we set backgroundColor:'transparent' on the element so rough.js draws nothing).
  const uniformDotsSetRef = useRef<Map<string, string>>(new Map());
  const dotCanvasRef      = useRef<HTMLCanvasElement>(null);
  const wrapperRef        = useRef<HTMLDivElement>(null);

  // ── Highlighter overlay ─────────────────────────────────────────────────
  // GoodNotes-style highlighter implementation:
  //
  // PHYSICS / MATH:
  // • Multiply blend mode — color values are multiplied: result = (src × dst) / 255.
  //   On white (#fff) background, multiply is identity → pure highlight color shows.
  //   On ink (#000), multiply darkens → text stays readable through the highlight.
  // • Flat alpha (35%) across entire stroke — NO self-overlap darkening within a
  //   single stroke. Achieved by rendering each stroke as one path on an offscreen
  //   canvas, then compositing the result onto the main overlay with flat alpha.
  // • Wide chisel-like stroke width (3× the original) — simulates a physical marker.
  // • Round line caps + joins for smooth, natural appearance.
  //
  // ARCHITECTURE:
  // • highlighterSetRef maps element ID → { color, strokeWidth } captured at draw time.
  // • When activePenType === 'highlighter', we tag new freedraw elements and set their
  //   Excalidraw opacity to 5 (nearly invisible) so the native renderer doesn't double-draw.
  // • drawHighlighter() re-renders all tagged strokes onto highlighterCanvasRef using
  //   multiply compositing, positioned in sync with Excalidraw's zoom/scroll.

  const highlighterSetRef    = useRef<Map<string, { color: string; width: number }>>(new Map());
  const highlighterCanvasRef = useRef<HTMLCanvasElement>(null);
  // Track element count so we know when new elements appear
  const prevElementCountRef  = useRef(0);

  // Persist highlighter IDs to localStorage so they survive page refreshes
  const HIGHLIGHTER_STORAGE_KEY = 'studyos-highlighter-ids';

  // Load persisted highlighter IDs on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIGHLIGHTER_STORAGE_KEY);
      if (raw) {
        const entries = JSON.parse(raw) as Array<[string, { color: string; width: number }]>;
        entries.forEach(([id, data]) => highlighterSetRef.current.set(id, data));
      }
    } catch {}
  }, []);

  // Save highlighter IDs whenever they change
  const persistHighlighterIds = useCallback(() => {
    try {
      const entries = Array.from(highlighterSetRef.current.entries());
      localStorage.setItem(HIGHLIGHTER_STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  }, []);

  // Renders all highlighter strokes onto highlighterCanvasRef.
  //
  // For each tagged freedraw element:
  //   1. Read el.points[] (relative to el.x, el.y)
  //   2. Convert to overlay-canvas coordinates using zoom/scroll
  //   3. Stroke the path with chisel width, round caps, on an offscreen canvas
  //   4. Composite the offscreen result onto the main overlay using globalAlpha=0.35
  //      and globalCompositeOperation='multiply'
  //
  // This two-pass approach (offscreen → composite) ensures that self-overlapping
  // regions within a single stroke do NOT darken — the entire stroke is uniformly
  // semi-transparent, exactly like a real highlighter marker.
  const drawHighlighter = useCallback(() => {
    const canvas = highlighterCanvasRef.current;
    const api    = apiRef.current;
    if (!canvas || !api) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const wrap = wrapperRef.current;
    if (wrap) {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width  = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
      }
    }

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    if (highlighterSetRef.current.size === 0) return;

    // Compute coordinate offsets
    const excCvs = document.querySelector('.excalidraw__canvas') as HTMLElement | null;
    if (!excCvs) return;
    const excRect  = excCvs.getBoundingClientRect();
    const wrapRect = canvas.getBoundingClientRect();
    const offX = excRect.left - wrapRect.left;
    const offY = excRect.top  - wrapRect.top;

    const appState = api.getAppState();
    const zoom     = appState.zoom.value;
    const scrollX  = appState.scrollX;
    const scrollY  = appState.scrollY;
    const elements = api.getSceneElements() as any[];

    // Clean up deleted elements
    for (const [elId] of highlighterSetRef.current) {
      const el = elements.find((e: any) => e.id === elId);
      if (!el || el.isDeleted) highlighterSetRef.current.delete(elId);
    }

    for (const [elId, hlData] of highlighterSetRef.current) {
      const el = elements.find((e: any) => e.id === elId);
      if (!el || el.isDeleted || !el.points || el.points.length < 2) continue;

      const pts = el.points as [number, number][];
      // Element origin in overlay-canvas coordinates
      const ex = offX + (el.x + scrollX) * zoom;
      const ey = offY + (el.y + scrollY) * zoom;

      // Chisel stroke width: 3× the original, minimum 12px screen-space
      const strokeW = Math.max(12, (hlData.width * 3) * zoom);

      // ── Pass 1: Render stroke at full opacity onto an offscreen canvas ──
      // This prevents self-overlap darkening within one stroke.
      const offscreen = new OffscreenCanvas(
        Math.ceil(w * (window.devicePixelRatio || 1)),
        Math.ceil(h * (window.devicePixelRatio || 1))
      );
      const offCtx = offscreen.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      offCtx.scale(dpr, dpr);

      offCtx.beginPath();
      offCtx.moveTo(ex + pts[0][0] * zoom, ey + pts[0][1] * zoom);

      // Catmull-Rom spline interpolation for smooth curves (GoodNotes uses this
      // for natural-feeling strokes). For each segment, we compute control points
      // from the surrounding points to create a smooth cubic Bézier curve.
      if (pts.length > 2) {
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[Math.max(0, i - 1)];
          const p1 = pts[i];
          const p2 = pts[Math.min(pts.length - 1, i + 1)];
          const p3 = pts[Math.min(pts.length - 1, i + 2)];

          // Catmull-Rom → cubic Bézier control points
          // tension = 0.5 (standard Catmull-Rom)
          const cp1x = ex + (p1[0] + (p2[0] - p0[0]) / 6) * zoom;
          const cp1y = ey + (p1[1] + (p2[1] - p0[1]) / 6) * zoom;
          const cp2x = ex + (p2[0] - (p3[0] - p1[0]) / 6) * zoom;
          const cp2y = ey + (p2[1] - (p3[1] - p1[1]) / 6) * zoom;
          const endx = ex + p2[0] * zoom;
          const endy = ey + p2[1] * zoom;

          offCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
        }
      } else {
        // Only 2 points — straight line
        offCtx.lineTo(ex + pts[1][0] * zoom, ey + pts[1][1] * zoom);
      }

      offCtx.strokeStyle = hlData.color;
      offCtx.lineWidth   = strokeW;
      offCtx.lineCap     = 'round';
      offCtx.lineJoin    = 'round';
      offCtx.globalAlpha = 1; // Full opacity on offscreen — alpha applied at composite
      offCtx.stroke();

      // ── Pass 2: Composite offscreen → main canvas with multiply + flat alpha ──
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.35;  // 35% opacity — matches GoodNotes translucency
      ctx.drawImage(offscreen, 0, 0, w, h);
      ctx.restore();
    }
  }, []);

  // Redraws all uniform-dot fills onto dotCanvasRef.
  // Called after any Excalidraw state change (onChange).
  const drawUniformDots = useCallback(() => {
    const canvas = dotCanvasRef.current;
    const api    = apiRef.current;
    if (!canvas || !api) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync canvas size to wrapper
    const wrap = wrapperRef.current;
    if (wrap) { canvas.width = wrap.clientWidth; canvas.height = wrap.clientHeight; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (uniformDotsSetRef.current.size === 0) return;

    // Offset of excalidraw canvas top-left relative to our overlay canvas
    const excCvs = document.querySelector('.excalidraw__canvas') as HTMLElement | null;
    if (!excCvs) return;
    const excRect  = excCvs.getBoundingClientRect();
    const wrapRect = canvas.getBoundingClientRect();
    const offX = excRect.left - wrapRect.left;
    const offY = excRect.top  - wrapRect.top;

    const appState = api.getAppState();
    const zoom     = appState.zoom.value;
    const scrollX  = appState.scrollX;
    const scrollY  = appState.scrollY;
    const elements = api.getSceneElements() as any[];

    for (const [elId, storedColor] of uniformDotsSetRef.current) {
      const el = elements.find((e: any) => e.id === elId);
      if (!el || el.isDeleted) { uniformDotsSetRef.current.delete(elId); continue; }

      // Scene → overlay-canvas coordinates
      const sx = offX + el.x * zoom + scrollX;
      const sy = offY + el.y * zoom + scrollY;
      const sw = el.width  * zoom;
      const sh = el.height * zoom;

      ctx.save();

      // ─ Clip to element shape ──────────────────────────────────────
      ctx.beginPath();
      if (el.type === 'ellipse') {
        ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
      } else if (el.type === 'diamond') {
        ctx.moveTo(sx + sw / 2, sy);
        ctx.lineTo(sx + sw, sy + sh / 2);
        ctx.lineTo(sx + sw / 2, sy + sh);
        ctx.lineTo(sx, sy + sh / 2);
      } else if (el.type === 'line' && el.points?.length > 0) {
        const pts = el.points as [number, number][];
        ctx.moveTo(sx + pts[0][0] * zoom, sy + pts[0][1] * zoom);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(sx + pts[i][0] * zoom, sy + pts[i][1] * zoom);
        }
      } else {
        // rectangle / rounded-rect / stadium
        const rVal = el.roundness?.value ?? 0;
        const r = Math.min(rVal * zoom, sw / 2, sh / 2);
        if (r > 0 && ctx.roundRect) {
          (ctx as any).roundRect(sx, sy, sw, sh, r);
        } else {
          ctx.rect(sx, sy, sw, sh);
        }
      }
      ctx.closePath();
      ctx.clip();

      // Use the color captured at click-time (el.backgroundColor is now 'transparent').
      const dotColor = storedColor || el.strokeColor || '#555';
      ctx.fillStyle = dotColor;
      ctx.globalAlpha = 0.7;

      // Dot grid geometry — responds to Excalidraw's Sloppiness slider (el.roughness: 0|1|2).
      // roughness 0 (Architect)  → tight dense grid  (spacing  8, r 1.0)
      // roughness 1 (Artist)     → medium grid        (spacing 14, r 1.8)
      // roughness 2 (Cartoonist) → loose airy grid    (spacing 22, r 2.6)
      const roughness   = el.roughness ?? 1;
      const baseSpacing = 8 + roughness * 7;   // 8 → 15 → 22
      const baseDotR    = 1 + roughness * 0.8; // 1.0 → 1.8 → 2.6
      const spacing = Math.max(6,   baseSpacing * zoom);
      const dotR    = Math.max(0.8, baseDotR    * zoom);

      // Align grid to a fixed origin so dots don't shift when element moves.
      // Use integer multiples of spacing anchored at (0,0) in canvas space.
      const colStart = Math.floor((sx) / spacing);
      const rowStart = Math.floor((sy) / spacing);
      const colEnd   = Math.ceil((sx + sw) / spacing);
      const rowEnd   = Math.ceil((sy + sh) / spacing);

      for (let col = colStart; col <= colEnd; col++) {
        for (let row = rowStart; row <= rowEnd; row++) {
          ctx.beginPath();
          ctx.arc(col * spacing, row * spacing, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }, []);

  // ── All drawing state in refs (avoids stale closures in DOM event listeners) ──
  const apiRef           = useRef<any>(null);
  const activeToolRef    = useRef<ShapeName | null>(null);
  const isDraggingRef    = useRef(false);
  const dragStartRef     = useRef<{ x: number; y: number } | null>(null);
  const liveElementIdRef = useRef<string | null>(null);  // base id shared across multi-element shapes

  // Keep apiRef in sync
  useEffect(() => { apiRef.current = excalidrawAPI; }, [excalidrawAPI]);

  // ── Seed library ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (excalidrawAPI) {
      excalidrawAPI.updateLibrary({ libraryItems: LIBRARY_ITEMS, merge: true });
    }
  }, [excalidrawAPI]);

  // ── Highlighter: suppress native rendering after stroke completes ────────
  // We listen for pointerup on the canvas. After the user lifts their pen,
  // we wait 300ms (giving Excalidraw time to finalize the element), then
  // set opacity=5 on any tagged highlighter elements that still have opacity=100.
  // This deferred approach avoids the fatal bug where updateScene() during
  // an active freedraw gesture aborts it after 1 point.
  useEffect(() => {
    if (!excalidrawAPI) return;

    const onPointerUp = () => {
      if ((window as any).activePenType !== 'highlighter') return;

      setTimeout(() => {
        const api = apiRef.current;
        if (!api) return;

        const elements = api.getSceneElements() as any[];
        let changed = false;
        const updated = elements.map((el: any) => {
          if (
            highlighterSetRef.current.has(el.id) &&
            el.opacity !== 5 &&
            !el.isDeleted
          ) {
            changed = true;
            return { ...el, opacity: 5 };
          }
          return el;
        });

        if (changed) {
          api.updateScene({ elements: updated });
          persistHighlighterIds();
          drawHighlighter();
        }
      }, 300); // 300ms delay ensures Excalidraw has fully finalized the stroke
    };

    // Attach to window so it fires even if pointer leaves the canvas
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [excalidrawAPI, persistHighlighterIds, drawHighlighter]);

  // ── Caveat font: Global CSS Override + UI Renaming ─────────────
  //
  //  HOW IT WORKS:
  //  • We don't use canvas interceptors or fake DOM buttons because they break 
  //    Excalidraw's internal popover state and cause React rendering loops.
  //  • Instead, we globally override the "Excalifont" CSS @font-face to point to Caveat.
  //  • Then we use a MutationObserver to rename the native "Excalifont" button
  //    in the font picker to "Caveat".
  //  • Excalidraw handles the click, the state, and the popup closing natively!

  useEffect(() => {
    if (!excalidrawAPI) return;

    // 1. Inject global CSS to override Excalifont with Caveat
    const styleId = 'studyos-caveat-override';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      // We use !important and redefine the @font-face to forcefully override Excalifont.
      style.innerHTML = `
        @font-face {
          font-family: 'Excalifont';
          src: url(https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2Q7ZjYYiA.woff2) format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        /* Make sure the text editor uses it correctly if there's any specificity issues */
        .excalidraw-textEditorContainer textarea {
          font-family: 'Excalifont', 'Caveat', cursive !important;
        }

        /* ── CSS ONLY UI RENAMING ── */
        /* Hide Excalidraw's SVG icon */
        .dropdown-menu-item-base[data-studyos-caveat="true"] svg {
          display: none !important;
        }
        /* Inject our "Aa" icon as a ::before on the icon container */
        .dropdown-menu-item-base[data-studyos-caveat="true"] > *:first-child::before {
          content: 'Aa';
          font-family: 'Caveat', cursive !important;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          line-height: 1;
        }
        /* Hide the original text by setting text-indent or using transparent color so width is PRESERVED */
        .dropdown-menu-item-base[data-studyos-caveat="true"] .studyos-caveat-text-target {
          color: transparent !important;
          position: relative;
          display: inline-block;
          min-width: 65px; /* Ensure button width doesn't collapse causing spurious pointerleave events */
        }
        /* Inject the new text "Caveat" */
        .dropdown-menu-item-base[data-studyos-caveat="true"] .studyos-caveat-text-target::after {
          content: 'Caveat';
          font-family: 'Caveat', cursive !important;
          font-size: 16px !important;
          font-weight: 500;
          color: var(--text-primary-color, inherit);
          position: absolute;
          left: 0;
          top: 0;
          pointer-events: none; /* Crucial so we don't interfere with React's hover tracking */
        }
      `;
      document.head.appendChild(style);
    }

    // 2. Preload it
    (async () => {
      try {
        if (!document.fonts.check('12px Caveat')) {
          const face = new FontFace(
            'Caveat',
            "url(https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2Q7ZjYYiA.woff2) format('woff2')",
            { weight: '400 700', style: 'normal', display: 'swap' }
          );
          await face.load();
          document.fonts.add(face);
        }
      } catch (e) {
        console.warn('[StudyOS] Caveat load error:', e);
      }
    })();

    // 3. Rename the native "Excalifont" button in the picker using ONLY CSS
    // to avoid mutating DOM nodes that React is actively tracking (which caused crashes).
    let rafId: number;
    const renameExcalifontButton = () => {
      cancelAnimationFrame(rafId);
      // Defer to the next animation frame so we don't execute during React's synchronous microtasks
      rafId = requestAnimationFrame(() => {
        const fontMenu = document.querySelector('.excalidraw .dropdown-menu.fonts');
        if (!fontMenu) return;

        const items = fontMenu.querySelectorAll('.dropdown-menu-item-base');
        items.forEach(item => {
          if (!item.hasAttribute('data-studyos-caveat')) {
            const textSpan = Array.from(item.querySelectorAll('span')).find(
              s => s.textContent === 'Excalifont' || s.textContent === 'Caveat'
            );
            
            if (textSpan && textSpan.textContent === 'Excalifont') {
              // Add a data attribute so our CSS can target this specific button safely
              item.setAttribute('data-studyos-caveat', 'true');
              // Give the text span a specific class so we can hide its text
              textSpan.classList.add('studyos-caveat-text-target');
            }
          }
        });
      });
    };

    // Observer to re-apply the text rename whenever the popup opens
    const observer = new MutationObserver(() => renameExcalifontButton());
    observer.observe(document.body, { childList: true, subtree: true });

    renameExcalifontButton();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      // We purposefully DO NOT remove the style override on unmount because the canvas 
      // might still be rendering. It's safer to keep it globally loaded.
    };
  }, [excalidrawAPI]);

  useEffect(() => {
    if (!excalidrawAPI) return;

    // Only inject "Zigzag" now; "Dots" is handled by our canvas overlay
    const FILL_STYLES = ["zigzag"] as const;

    const applyUniformDots = () => {
      const elements  = excalidrawAPI.getSceneElements() as any[];
      const appState  = excalidrawAPI.getAppState();
      const selectedIds = appState.selectedElementIds || {};
      const hasSelection = Object.keys(selectedIds).length > 0;
      if (hasSelection) {
        // Mark elements as having uniform-dot fill in our registry.
        // Set fillStyle solid + transparent background so rough.js draws nothing.
        excalidrawAPI.updateScene({
          elements: elements.map((el: any) => {
            if (!selectedIds[el.id]) return el;
            // Capture the fill color NOW before we clear it.
            const dotColor = (el.backgroundColor && el.backgroundColor !== 'transparent')
              ? el.backgroundColor : (el.strokeColor || '#555');
            uniformDotsSetRef.current.set(el.id, dotColor);
            // backgroundColor must be 'transparent' so rough.js renders nothing
            // (fillStyle:'solid' + transparent bg = no fill from rough.js)
            return { ...el, fillStyle: 'solid', backgroundColor: 'transparent' };
          }),
        });
      }
      // Mark the button active
      const container = document.querySelector('.excalidraw');
      container?.querySelectorAll('.studyos-dots-btn').forEach(b => b.classList.add('active'));
      drawUniformDots();
    };

    const applyFillStyle = (newFillStyle: string) => {
      const elements  = excalidrawAPI.getSceneElements();
      const appState  = excalidrawAPI.getAppState();
      const selectedIds = appState.selectedElementIds || {};
      const hasSelection = Object.keys(selectedIds).length > 0;
      if (hasSelection) {
        excalidrawAPI.updateScene({
          elements: (elements as any[]).map((el: any) =>
            selectedIds[el.id] ? { ...el, fillStyle: newFillStyle } : el
          ),
          appState: { currentItemFillStyle: newFillStyle },
        });
      } else {
        excalidrawAPI.updateScene({ appState: { currentItemFillStyle: newFillStyle } });
      }
    };

    const injectFillButtons = () => {
      const container = document.querySelector('.excalidraw');
      if (!container) return;
      const solidBtn = container.querySelector('button[title="Solid"], button[aria-label="Solid"]');
      if (!solidBtn) return;
      const buttonList = solidBtn.parentElement;
      if (!buttonList) return;

      // Remove previous injected buttons
      buttonList.querySelectorAll('.studyos-fill-btn, .studyos-dots-btn').forEach(b => b.remove());

      // ─ Uniform Dots button ───────────────────────────────────────
      const dotsBtn = document.createElement('button');
      dotsBtn.type = 'button';
      dotsBtn.className = 'ToolIcon ToolIcon_size_medium studyos-dots-btn';
      dotsBtn.title = 'Uniform Dots';
      dotsBtn.setAttribute('aria-label', 'Uniform Dots fill');
      dotsBtn.innerHTML = DASHED_SVG; // reuse existing icon (rows of short segments = dot rows)
      dotsBtn.addEventListener('click', applyUniformDots);
      buttonList.appendChild(dotsBtn);

      // ─ Zigzag button(s) ─────────────────────────────────────────
      FILL_STYLES.forEach((style) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ToolIcon ToolIcon_size_medium studyos-fill-btn';
        btn.title = 'Zigzag';
        btn.setAttribute('aria-label', 'Zigzag fill');
        btn.innerHTML = ZIGZAG_SVG;
        const currentFill = excalidrawAPI.getAppState().currentItemFillStyle;
        if (currentFill === style) btn.classList.add('active');
        btn.addEventListener('click', () => {
          applyFillStyle(style);
          buttonList.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
        buttonList.appendChild(btn);
      });
    };

    const timer = setTimeout(injectFillButtons, 500);
    const observer = new MutationObserver(() => {
      const container = document.querySelector('.excalidraw');
      if (container) {
        const solidBtn = container.querySelector('button[title="Solid"], button[aria-label="Solid"]');
        if (solidBtn && !container.querySelector('.studyos-dots-btn')) injectFillButtons();
      }
    });
    const excalidrawRoot = document.querySelector('.excalidraw');
    if (excalidrawRoot) observer.observe(excalidrawRoot, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.querySelectorAll('.studyos-fill-btn, .studyos-dots-btn').forEach(b => b.remove());
    };
  }, [excalidrawAPI, drawUniformDots]);

  // ── Read current style settings from Excalidraw appState ─────────────────
  const readStyle = useCallback(() => {
    const api = apiRef.current;
    if (!api) return { strokeColor: "#1e1e1e", backgroundColor: "transparent", strokeWidth: 2, strokeStyle: "solid", roughness: 1, fillStyle: "hachure" }; // ← CHANGED: Default fillStyle added
    const s = api.getAppState();
    return {
      strokeColor:     s.currentItemStrokeColor     ?? "#1e1e1e",
      backgroundColor: s.currentItemBackgroundColor ?? "transparent",
      strokeWidth:     s.currentItemStrokeWidth     ?? 2,
      strokeStyle:     s.currentItemStrokeStyle     ?? "solid",
      roughness:       s.currentItemRoughness       ?? 1,
      fillStyle:       s.currentItemFillStyle       ?? "hachure", // ← CHANGED: Read currentItemFillStyle
    };
  }, []);

  // ── Activate / deactivate helpers ────────────────────────────────────────
  const activateCustomTool = useCallback((name: ShapeName) => {
    activeToolRef.current = name;          // sync ref immediately — DOM handlers read this
    setActiveCustomTool(name);             // async state — drives UI highlight only
    apiRef.current?.setActiveTool({ type: "selection" }); // prevent Excalidraw from drawing

    const canvas = document.querySelector(".excalidraw__canvas") as HTMLElement | null;
    if (canvas) canvas.style.cursor = "crosshair";
  }, []);

  const deactivateCustomTool = useCallback(() => {
    activeToolRef.current = null;
    setActiveCustomTool(null);
    isDraggingRef.current    = false;
    dragStartRef.current     = null;
    liveElementIdRef.current = null;

    const canvas = document.querySelector(".excalidraw__canvas") as HTMLElement | null;
    if (canvas) canvas.style.cursor = "";
  }, []);

  // ── Direct canvas pointer listeners (re-attached when API mounts) ─────────
  // Using addEventListener on the canvas DOM node instead of Excalidraw's
  // onPointerDown/Up props because those props don't fire when activeTool is
  // "selection" — the very mode we must use to suppress Excalidraw's own drawing.
  useEffect(() => {
    if (!excalidrawAPI) return;

    // The interactive canvas (receives pointer events)
    const getCanvas = () =>
      document.querySelector(".excalidraw__canvas.interactive") as HTMLElement | null
      ?? document.querySelector(".excalidraw__canvas") as HTMLElement | null;

    let canvas = getCanvas();
    if (!canvas) return;

    function onPointerDown(e: PointerEvent) {
      if (!activeToolRef.current) return;   // not our tool — let Excalidraw handle it
      if (e.button !== 0) return;           // left button only

      e.stopPropagation();                  // prevent Excalidraw from intercepting

      const cvs = getCanvas();
      if (!cvs || !apiRef.current) return;

      const scene = screenToScene(e.clientX, e.clientY, cvs, apiRef.current);
      isDraggingRef.current    = true;
      dragStartRef.current     = scene;

      const elId = crypto.randomUUID();
      liveElementIdRef.current = elId;

      const style = readStyle();
      const result = buildShapeElement(
        activeToolRef.current, scene.x, scene.y, 1, 1,
        style.strokeColor, style.backgroundColor,
        style.strokeWidth, style.strokeStyle, style.roughness,
        style.fillStyle, // ← CHANGED: pass fillStyle
        elId
      );
      const flat = flatElements(result);
      if (!flat.length) return;

      const api = apiRef.current;
      api.updateScene({ elements: [...api.getSceneElements(), ...flat] });
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDraggingRef.current || !dragStartRef.current || !liveElementIdRef.current) return;
      if (!activeToolRef.current) return;

      const cvs = getCanvas();
      if (!cvs || !apiRef.current) return;

      const scene = screenToScene(e.clientX, e.clientY, cvs, apiRef.current);
      const sx = dragStartRef.current.x, sy = dragStartRef.current.y;
      const x = Math.min(scene.x, sx);
      const y = Math.min(scene.y, sy);
      const w = Math.abs(scene.x - sx);
      const h = Math.abs(scene.y - sy);
      if (w < 2 || h < 2) return;

      const elId  = liveElementIdRef.current;
      const style = readStyle();
      const result = buildShapeElement(
        activeToolRef.current, x, y, w, h,
        style.strokeColor, style.backgroundColor,
        style.strokeWidth, style.strokeStyle, style.roughness,
        style.fillStyle, // ← CHANGED: pass fillStyle
        elId
      );
      const updated = flatElements(result);
      if (!updated.length) return;

      const updatedIds = new Set(updated.map((el: any) => el.id));
      const api = apiRef.current;
      const kept = (api.getSceneElements() as any[]).filter((el: any) => !updatedIds.has(el.id));
      api.updateScene({ elements: [...kept, ...updated] });
    }

    function onPointerUp(e: PointerEvent) {
      if (!isDraggingRef.current || !liveElementIdRef.current) return;
      if (!activeToolRef.current) return;

      const cvs = getCanvas();
      if (!cvs || !apiRef.current) return;

      const scene = screenToScene(e.clientX, e.clientY, cvs, apiRef.current);
      const sx = dragStartRef.current!.x, sy = dragStartRef.current!.y;
      const w = Math.abs(scene.x - sx);
      const h = Math.abs(scene.y - sy);

      const elId  = liveElementIdRef.current;
      const style = readStyle();

      let finalEls: any[];
      if (w < 5 && h < 5) {
        const dw = 160, dh = 120;
        const result = buildShapeElement(
          activeToolRef.current,
          scene.x - dw / 2, scene.y - dh / 2, dw, dh,
          style.strokeColor, style.backgroundColor,
          style.strokeWidth, style.strokeStyle, style.roughness,
          style.fillStyle, elId
        );
        finalEls = flatElements(result);
      } else {
        const x = Math.min(scene.x, sx);
        const y = Math.min(scene.y, sy);
        const result = buildShapeElement(
          activeToolRef.current, x, y, w, h,
          style.strokeColor, style.backgroundColor,
          style.strokeWidth, style.strokeStyle, style.roughness,
          style.fillStyle, elId
        );
        finalEls = flatElements(result);
      }

      const finalIds = new Set(finalEls.map((el: any) => el.id));
      const api = apiRef.current;
      const kept = (api.getSceneElements() as any[]).filter((el: any) => !finalIds.has(el.id));
      const selectedElementIds: Record<string, boolean> = {};
      for (const el of finalEls) selectedElementIds[el.id] = true;
      api.updateScene({ elements: [...kept, ...finalEls], appState: { selectedElementIds } });

      isDraggingRef.current    = false;
      dragStartRef.current     = null;
      liveElementIdRef.current = null;

      deactivateCustomTool();
      apiRef.current?.setActiveTool({ type: "selection" });
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup",   onPointerUp);

    return () => {
      canvas!.removeEventListener("pointerdown", onPointerDown);
      canvas!.removeEventListener("pointermove", onPointerMove);
      canvas!.removeEventListener("pointerup",   onPointerUp);
    };
  }, [excalidrawAPI, readStyle, deactivateCustomTool]);

  // ── Escape key: cancel custom shape tool OR lasso ───────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeToolRef.current) {
        deactivateCustomTool();
        apiRef.current?.setActiveTool({ type: "selection" });
      }
      if (isLassoRef.current) {
        isLassoRef.current    = false;
        setIsLassoActive(false);
        lassoDrawingRef.current = false;
        lassoPointsRef.current  = [];
        if (lassoSvgRef.current) lassoSvgRef.current.style.visibility = "hidden";
      }
    };
    window.addEventListener("keydown", onKey);
  }, [deactivateCustomTool]);

  // ── Deactivate when user clicks a native Excalidraw tool ─────────────────
  // We watch onChange for activeTool changes instead of the non-existent onActiveTool prop
  const prevExcalidrawTool = useRef<string>("selection");
  useEffect(() => {
    if (!excalidrawAPI) return;
    const unsub = excalidrawAPI.onChange((_els: any, appState: any) => {
      const currentType = appState?.activeTool?.type;
      if (
        currentType &&
        currentType !== "selection" &&
        currentType !== prevExcalidrawTool.current &&
        activeToolRef.current
      ) {
        setTimeout(() => deactivateCustomTool(), 0);
      }
      prevExcalidrawTool.current = currentType ?? "selection";

      // Sync active class for Zigzag fill button
      const currentFill = appState?.currentItemFillStyle;
      document.querySelectorAll('.studyos-fill-btn').forEach((btn) => {
        btn.classList.toggle('active', currentFill === 'zigzag');
      });

      // Redraw uniform dots overlay on every scene change
      drawUniformDots();
    });
    return unsub;
  }, [excalidrawAPI, deactivateCustomTool]);

  // ── Lasso canvas event listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!excalidrawAPI) return;

    const getCanvas = () =>
      document.querySelector(".excalidraw__canvas.interactive") as HTMLElement | null
      ?? document.querySelector(".excalidraw__canvas") as HTMLElement | null;

    // Build a compact SVG path string from accumulated screen points.
    const buildPath = (pts: [number,number][]) => {
      if (pts.length < 2) return "";
      return "M " + pts[0][0] + " " + pts[0][1] +
        pts.slice(1).map(p => " L " + p[0] + " " + p[1]).join("") + " Z";
    };

    function onLassoDown(e: PointerEvent) {
      if (!isLassoRef.current) return;
      if (e.button !== 0) return;
      e.stopPropagation();

      const cvs = getCanvas();
      if (!cvs) return;
      const rect = cvs.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      lassoDrawingRef.current = true;
      lassoPointsRef.current  = [[sx, sy]];

      // Show SVG overlay
      if (lassoSvgRef.current) lassoSvgRef.current.style.visibility = "visible";
      if (lassoPathRef.current) lassoPathRef.current.setAttribute("d", "");
      if (lassoFillRef.current) lassoFillRef.current.setAttribute("d", "");
    }

    function onLassoMove(e: PointerEvent) {
      if (!lassoDrawingRef.current || !isLassoRef.current) return;
      const cvs = getCanvas();
      if (!cvs) return;
      const rect = cvs.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // Downsample: skip if < 3px from last point (performance)
      const pts = lassoPointsRef.current;
      const last = pts[pts.length - 1];
      if (last && Math.hypot(sx - last[0], sy - last[1]) < 3) return;

      pts.push([sx, sy]);
      const d = buildPath(pts);
      if (lassoPathRef.current) lassoPathRef.current.setAttribute("d", d);
      if (lassoFillRef.current) lassoFillRef.current.setAttribute("d", d);
    }

    function onLassoUp(e: PointerEvent) {
      if (!lassoDrawingRef.current || !isLassoRef.current) return;
      lassoDrawingRef.current = false;

      const pts = lassoPointsRef.current;
      if (pts.length < 5) {
        // Too small a gesture — treat as a click, clear and bail
        if (lassoSvgRef.current) lassoSvgRef.current.style.visibility = "hidden";
        lassoPointsRef.current = [];
        return;
      }

      // Convert screen points → scene coordinates
      const cvs = getCanvas();
      const api = apiRef.current;
      if (!cvs || !api) return;
      const rect      = cvs.getBoundingClientRect();
      const appState  = api.getAppState();
      const zoom      = appState.zoom.value;
      const scrollX   = appState.scrollX;
      const scrollY   = appState.scrollY;

      const lassoScene: [number,number][] = pts.map(([sx, sy]) => [
        sx / zoom - scrollX / zoom,
        sy / zoom - scrollY / zoom,
      ]);

      // Find all non-deleted elements whose AABB intersects the lasso polygon
      const elements    = api.getSceneElements() as any[];
      const selectedIds: Record<string,boolean> = {};
      const groupsSeen  = new Set<string>();

      for (const el of elements) {
        if (el.isDeleted) continue;
        if (elementIntersectsLasso(el, lassoScene)) {
          selectedIds[el.id] = true;
          // Expand to whole group so grouped shapes move together
          if (el.groupIds?.length > 0) {
            el.groupIds.forEach((gid: string) => groupsSeen.add(gid));
          }
        }
      }

      // Include all group-mates of any selected element
      if (groupsSeen.size > 0) {
        for (const el of elements) {
          if (!el.isDeleted && el.groupIds?.some((g: string) => groupsSeen.has(g))) {
            selectedIds[el.id] = true;
          }
        }
      }

      api.updateScene({ appState: { selectedElementIds: selectedIds } });
      api.setActiveTool({ type: "selection" });

      // Reset lasso state
      isLassoRef.current = false;
      setIsLassoActive(false);
      lassoPointsRef.current = [];
      if (lassoSvgRef.current) lassoSvgRef.current.style.visibility = "hidden";
      if (lassoPathRef.current) lassoPathRef.current.setAttribute("d", "");
      if (lassoFillRef.current) lassoFillRef.current.setAttribute("d", "");
    }

    const cvs = getCanvas();
    if (!cvs) return;
    cvs.addEventListener("pointerdown", onLassoDown, { capture: true });
    cvs.addEventListener("pointermove", onLassoMove, { capture: true });
    cvs.addEventListener("pointerup",   onLassoUp,   { capture: true });
    return () => {
      cvs.removeEventListener("pointerdown", onLassoDown, { capture: true });
      cvs.removeEventListener("pointermove", onLassoMove, { capture: true });
      cvs.removeEventListener("pointerup",   onLassoUp,   { capture: true });
    };
  }, [excalidrawAPI]);

  // ── Stable prop references for ExcalidrawWithMenu ──────────────────────────
  // Inline functions/objects passed as props to Excalidraw are re-created on
  // every render of ExcalidrawCanvas. Excalidraw then sees "new" props, triggers
  // internal PanelComponent state updates during render → React warning.
  // useCallback/useMemo give Excalidraw stable references that only change
  // when the actual dependencies change.

  const uiOptions = useMemo(() => ({
    canvasActions: {
      saveAsImage: true,
      export: { saveFileToDisk: true },
      toggleTheme: false,
    },
  }), []); // never changes

  // The excalidrawAPI callback must also be stable — passing a new inline arrow
  // function each render causes Excalidraw to re-process it, which triggers
  // PanelComponent setState during render.
  const handleExcalidrawAPI = useCallback((api: any) => {
    apiRef.current = api;
    if (typeof window !== "undefined" && api) (window as any).EXC = api;
    // Defer setState so it fires AFTER Excalidraw's current render cycle.
    setTimeout(() => setExcalidrawAPI(api), 0);
  }, []); // empty deps — refs & setTimeout are stable by nature

  const renderTopRightUI = useCallback(() => (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <LassoButton
        active={isLassoActive}
        onClick={() => {
          const next = !isLassoActive;
          if (next) {
            deactivateCustomTool();
            apiRef.current?.setActiveTool({ type: "selection" });
          }
          isLassoRef.current = next;
          setIsLassoActive(next);
          const cvs = document.querySelector(".excalidraw__canvas") as HTMLElement | null;
          if (cvs) cvs.style.cursor = next ? "crosshair" : "";
        }}
      />
      <MoreShapesButton
        activeTool={activeCustomTool}
        onSelect={(name) => {
          isLassoRef.current = false;
          setIsLassoActive(false);
          activateCustomTool(name);
        }}
      />
    </div>
  ), [isLassoActive, activeCustomTool, deactivateCustomTool, activateCustomTool]);

  return (
    <div ref={wrapperRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* ── Highlighter canvas overlay (z=2, BELOW dots and lasso) ────────── */}
      {/* Renders behind the main Excalidraw canvas content conceptually, */}
      {/* but since Excalidraw's native rendering of highlighted elements is */}
      {/* suppressed (opacity:5), this overlay IS the visual representation. */}
      <canvas
        ref={highlighterCanvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
      {/* ── Uniform-dots canvas overlay (z=5, below lasso at z=20) ────────── */}
      <canvas
        ref={dotCanvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      {/* ── Lasso SVG overlay (marching-ants path) ────────────────────── */}
      <svg
        ref={lassoSvgRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
          zIndex: 20,
          visibility: "hidden",
        }}
      >
        <defs>
          <style>{`
            @keyframes lasso-march { to { stroke-dashoffset: -16; } }
          `}</style>
        </defs>
        {/* Filled interior — subtle violet tint */}
        <path ref={lassoFillRef} fill="rgba(99,102,241,0.07)" stroke="none" />
        {/* White underline gives contrast on dark backgrounds */}
        <path d="" ref={null} fill="none" stroke="white" strokeWidth="3"
          strokeDasharray="8 4" strokeLinecap="round"
          style={{ animation: "lasso-march 0.45s linear infinite" }}
          // Note: share the same d via a wrapper — we update lassoPathRef only
        />
        {/* Violet dashed stroke on top */}
        <path ref={lassoPathRef} fill="none" stroke="#6366f1" strokeWidth="2"
          strokeDasharray="8 4" strokeLinecap="round"
          style={{ animation: "lasso-march 0.45s linear infinite" }}
        />
      </svg>
      <style>{`
        .excalidraw [aria-label="Excalidraw+"],
        button[title="Excalidraw+"],
        a[title="Excalidraw+"]                { display: none !important; }

        .excalidraw [data-testid="collab-button"],
        button[title="Share"]                  { display: none !important; }

        .excalidraw .ToolIcon__lock,
        .excalidraw [data-testid="lock-button"],
        .excalidraw [data-testid="hand"],
        .excalidraw .panning-tool              { display: none !important; }

        .excalidraw .footer-center             { display: none !important; }

        .excalidraw .App-menu__left {
          margin-top: calc(var(--my-colors-panel-height, 111px) - 12px) !important;
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
          border-top: none !important;
        }

        .excalidraw [data-testid="mermaid-to-excalidraw"],
        .excalidraw button[title*="Mermaid"],
        .excalidraw button[aria-label*="Mermaid"],
        .excalidraw [data-testid="toolbar-magic"],
        .excalidraw [data-testid="toolbar-magic-button"],
        .excalidraw [aria-label="Magic"],
        .excalidraw .dropdown-menu-item:has(svg.mermaid-logo) {
          display: none !important;
        }
      `}</style>

      <ExcalidrawWithMenu
        theme="light"
        excalidrawAPI={handleExcalidrawAPI}
        UIOptions={uiOptions}
        renderTopRightUI={renderTopRightUI}
        onChange={() => {
          // ── Highlighter detection + overlay redraw ──
          // CRITICAL: We do NOT call updateScene() here because it aborts
          // Excalidraw's active freedraw gesture (resets the element to 1 point).
          // Instead we only tag new elements in our ref (zero side-effects) and
          // let the pointerup handler suppress opacity after the stroke completes.
          const api = apiRef.current;
          if (!api) return;

          const elements = api.getSceneElements() as any[];
          const isHighlighter = (window as any).activePenType === 'highlighter';

          if (isHighlighter) {
            // Tag any freedraw elements we haven't seen yet
            for (const el of elements) {
              if (el.type === 'freedraw' && !el.isDeleted && !highlighterSetRef.current.has(el.id)) {
                // Only tag if not already a full-opacity normal stroke
                // (opacity 100 = normal, opacity 5 = already suppressed)
                if (el.opacity === 100) {
                  highlighterSetRef.current.set(el.id, {
                    color: el.strokeColor || '#ffeb3b',
                    width: el.strokeWidth || 2,
                  });
                }
              }
            }
          }

          // Always redraw overlays (handles zoom/scroll changes too)
          drawHighlighter();
          drawUniformDots();
        }}
      />

      <MyColorsPanel excalidrawAPI={excalidrawAPI} isCustomShapeActive={!!activeCustomTool} />
    </div>
  );
}
