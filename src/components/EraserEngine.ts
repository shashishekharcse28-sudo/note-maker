// ─── StudyOS Eraser Engine ────────────────────────────────────────────────────
// Pure math — no React, no DOM. All functions are verbatim from the spec.

export interface Pt { x: number; y: number; }
export interface BBox { x: number; y: number; w: number; h: number; }

// Excalidraw freedraw element shape (partial)
export interface FreedrawEl {
  id: string;
  type: string;
  x: number; y: number;
  width: number; height: number;
  points: readonly [number, number][];
  pressures: readonly number[];
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  version?: number;
  versionNonce?: number;
  isDeleted?: boolean;
  updated?: number;
  [key: string]: unknown;
}

// ── Slider → radius ───────────────────────────────────────────────────────────
export function sliderToRadius(value: number): number {
  const normalized = value / 100;
  const curved = Math.pow(normalized, 0.6);
  return 4 + curved * 96;
}

// ── Screen → scene coords ─────────────────────────────────────────────────────
export function screenToScene(
  sx: number, sy: number,
  scrollX: number, scrollY: number,
  zoom: number,
): Pt {
  return { x: sx / zoom - scrollX, y: sy / zoom - scrollY };
}

// ── AABB vs circle fast reject ────────────────────────────────────────────────
export function circleHitsAABB(cx: number, cy: number, r: number, b: BBox): boolean {
  const nx = Math.max(b.x, Math.min(cx, b.x + b.w));
  const ny = Math.max(b.y, Math.min(cy, b.y + b.h));
  return Math.hypot(cx - nx, cy - ny) <= r;
}

// ── Segment → circle minimum distance ────────────────────────────────────────
export function segCircleDist(p1: Pt, p2: Pt, cx: number, cy: number): number {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p1.x - cx, p1.y - cy);
  const t = Math.max(0, Math.min(1, ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq));
  return Math.hypot(cx - (p1.x + t * dx), cy - (p1.y + t * dy));
}

// ── Parametric segment vs circle intersection ─────────────────────────────────
interface SegHit { enter: number | null; exit: number | null; fullyInside: boolean; }
export function segCircleIntersect(p1: Pt, p2: Pt, cx: number, cy: number, r: number): SegHit | null {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const fx = p1.x - cx, fy = p1.y - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / (2 * a);
  const t2 = (-b + sq) / (2 * a);
  return {
    enter: (t1 >= 0 && t1 <= 1) ? t1 : null,
    exit:  (t2 >= 0 && t2 <= 1) ? t2 : null,
    fullyInside: t1 < 0 && t2 > 1,
  };
}

// ── Lerp helpers ──────────────────────────────────────────────────────────────
function lerpPt(p1: Pt, p2: Pt, t: number): Pt {
  return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
}
function lerpNum(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

// ── Segment-segment minimum distance (capsule sweep) ─────────────────────────
export function minDistSegSeg(a1: Pt, a2: Pt, b1: Pt, b2: Pt): number {
  const d1 = { x: a2.x - a1.x, y: a2.y - a1.y };
  const d2 = { x: b2.x - b1.x, y: b2.y - b1.y };
  const rv = { x: a1.x - b1.x, y: a1.y - b1.y };
  const a = d1.x * d1.x + d1.y * d1.y;
  const e = d2.x * d2.x + d2.y * d2.y;
  const f = d2.x * rv.x + d2.y * rv.y;
  let s: number, t: number;
  if (a <= 1e-10 && e <= 1e-10) return Math.hypot(rv.x, rv.y);
  if (a <= 1e-10) { t = clamp(f / e, 0, 1); s = 0; }
  else {
    const c2 = d1.x * rv.x + d1.y * rv.y;
    if (e <= 1e-10) { s = clamp(-c2 / a, 0, 1); t = 0; }
    else {
      const b2 = d1.x * d2.x + d1.y * d2.y;
      const denom = a * e - b2 * b2;
      s = denom !== 0 ? clamp((b2 * f - c2 * e) / denom, 0, 1) : 0;
      t = (b2 * s + f) / e;
      if      (t < 0) { t = 0; s = clamp(-c2 / a, 0, 1); }
      else if (t > 1) { t = 1; s = clamp((b2 - c2) / a, 0, 1); }
    }
  }
  return Math.hypot(a1.x + d1.x * s - b1.x - d2.x * t, a1.y + d1.y * s - b1.y - d2.y * t);
}

export function capsuleHitsSeg(capA: Pt, capB: Pt, r: number, p1: Pt, p2: Pt): boolean {
  return minDistSegSeg(capA, capB, p1, p2) <= r;
}

// ── Helpers: get absolute scene points + effective widths for a freedraw el ───
function absPts(el: FreedrawEl): Pt[] {
  return el.points.map(([dx, dy]) => ({ x: el.x + dx, y: el.y + dy }));
}
function effWidths(el: FreedrawEl): number[] {
  if (el.pressures?.length === el.points.length)
    return [...el.pressures].map(p => el.strokeWidth * (p || 0.5) * 2);
  return el.points.map(() => el.strokeWidth * 2);
}
function elBBox(el: FreedrawEl): BBox {
  const hw = el.strokeWidth;
  return { x: el.x - hw, y: el.y - hw, w: el.width + hw * 2, h: el.height + hw * 2 };
}

// ── Arc length ────────────────────────────────────────────────────────────────
function arcLen(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
  return len;
}
const MIN_STUB = 2.5; // px

// ── MODE 1: Stroke eraser ─────────────────────────────────────────────────────
// Returns IDs of freedraw elements fully erased by the capsule sweep.
export function strokeErase(
  capA: Pt, capB: Pt, r: number,
  elements: FreedrawEl[],
): string[] {
  const out: string[] = [];
  for (const el of elements) {
    if (el.type !== 'freedraw' || el.isDeleted) continue;
    const bbox = elBBox(el);
    // Expand bbox by r for quick capsule reject
    const exp: BBox = { x: bbox.x - r, y: bbox.y - r, w: bbox.w + r * 2, h: bbox.h + r * 2 };
    if (!circleHitsAABB(capA.x, capA.y, 0, exp) && !circleHitsAABB(capB.x, capB.y, 0, exp)) continue;
    const pts = absPts(el);
    const wids = effWidths(el);
    let hit = false;
    // Single point
    if (pts.length === 1) {
      hit = capsuleHitsSeg(capA, capB, r + wids[0] / 2, pts[0], pts[0]);
    } else {
      for (let i = 0; i < pts.length - 1 && !hit; i++) {
        const effR = r + (wids[i] + wids[i + 1]) / 4;
        hit = capsuleHitsSeg(capA, capB, effR, pts[i], pts[i + 1]);
      }
    }
    if (hit) out.push(el.id);
  }
  return out;
}

// ── MODE 2: Standard eraser — surgical split ──────────────────────────────────
interface StubPoints { pts: Pt[]; prs: number[]; }

function splitEl(el: FreedrawEl, cx: number, cy: number, eraserR: number): StubPoints[] {
  const pts  = absPts(el);
  const wids = effWidths(el);
  const prs  = el.pressures?.length === pts.length ? [...el.pressures] : pts.map(() => 0.5);
  const stubs: StubPoints[] = [];
  let curPts: Pt[] = [], curPrs: number[] = [];

  const firstEffR = eraserR + wids[0] / 2;
  let inside = Math.hypot(pts[0].x - cx, pts[0].y - cy) <= firstEffR;

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1];
    const w1 = wids[i], w2 = wids[i + 1];
    const pr1 = prs[i],  pr2 = prs[i + 1];
    const effR = eraserR + (w1 + w2) / 4;
    const hit  = segCircleIntersect(p1, p2, cx, cy, effR);

    if (!inside) {
      curPts.push(p1); curPrs.push(pr1);
      if (hit?.enter != null) {
        curPts.push(lerpPt(p1, p2, hit.enter)); curPrs.push(lerpNum(pr1, pr2, hit.enter));
        if (curPts.length >= 2) stubs.push({ pts: [...curPts], prs: [...curPrs] });
        curPts = []; curPrs = []; inside = true;
        if (hit.exit != null) {
          curPts.push(lerpPt(p1, p2, hit.exit)); curPrs.push(lerpNum(pr1, pr2, hit.exit));
          inside = false;
        }
      }
    } else {
      if (hit?.exit != null) {
        curPts.push(lerpPt(p1, p2, hit.exit)); curPrs.push(lerpNum(pr1, pr2, hit.exit));
        inside = false;
      }
    }
  }

  if (!inside && pts.length > 0) {
    curPts.push(pts.at(-1)!); curPrs.push(prs.at(-1)!);
    if (curPts.length >= 2) stubs.push({ pts: [...curPts], prs: [...curPrs] });
  }
  return stubs;
}

// Convert a stub into a new Excalidraw freedraw element
function makeStubEl(parent: FreedrawEl, stub: StubPoints): FreedrawEl | null {
  if (stub.pts.length < 2 || arcLen(stub.pts) < MIN_STUB) return null;
  const ox = stub.pts[0].x, oy = stub.pts[0].y;
  const relPts = stub.pts.map(p => [p.x - ox, p.y - oy] as [number, number]);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  relPts.forEach(([x, y]) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); });
  return {
    ...parent,
    id: crypto.randomUUID(),
    x: ox, y: oy,
    width: maxX - minX, height: maxY - minY,
    points: relPts,
    pressures: stub.prs,
    version: ((parent.version as number) || 1) + 1,
    versionNonce: Math.floor(Math.random() * 1e9),
    isDeleted: false,
    updated: Date.now(),
    groupIds: [],
    boundElements: null,
    seed: Math.floor(Math.random() * 2 ** 31),
  };
}

// Run standard eraser at (cx, cy) with radius r. Sweep from prevScene to curScene.
// Returns: { toDelete: string[], toAdd: FreedrawEl[] }
export function standardErase(
  prevScene: Pt, curScene: Pt, r: number,
  elements: FreedrawEl[],
): { toDelete: string[]; toAdd: FreedrawEl[] } {
  const toDelete: string[] = [];
  const toAdd:    FreedrawEl[] = [];

  const steps = Math.max(1, Math.ceil(Math.hypot(curScene.x - prevScene.x, curScene.y - prevScene.y) / (r * 0.5)));

  for (const el of elements) {
    if (el.type !== 'freedraw' || el.isDeleted) continue;

    let replacements: FreedrawEl[] = [el];
    let wasModified = false;

    for (let step = 0; step <= steps; step++) {
      const t = steps === 0 ? 0 : step / steps;
      const scx = prevScene.x + (curScene.x - prevScene.x) * t;
      const scy = prevScene.y + (curScene.y - prevScene.y) * t;

      const nextBatch: FreedrawEl[] = [];
      const batch = wasModified ? replacements.splice(0) : [el];

      for (const s of batch) {
        if (!circleHitsAABB(scx, scy, r, elBBox(s))) {
          nextBatch.push(s);
        } else {
          const stubs = splitEl(s, scx, scy, r)
            .map(stub => makeStubEl(s, stub))
            .filter(Boolean) as FreedrawEl[];
          nextBatch.push(...stubs);
          if (stubs.length !== 1 || stubs[0].points.length !== s.points.length) {
            wasModified = true;
          }
        }
      }
      replacements.push(...nextBatch);
    }

    if (wasModified) {
      toDelete.push(el.id);
      toAdd.push(...replacements);
    }
  }

  return { toDelete, toAdd };
}

// ── Eraser cursor overlay drawing ─────────────────────────────────────────────
export function drawEraserCursor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.fill();
  ctx.strokeStyle = '#a9a9a9';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([]);
  ctx.stroke();
}
