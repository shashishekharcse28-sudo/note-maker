import { generateId, generateTextElement, generateRectangleElement } from './excalidraw-generator';

// ─── Types matching Agent 1 + Agent 2 JSON output ───────────────────────────
export interface AIBlock {
  id: string;
  type: string;
  heading: string;
  body: string;
  importance?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  sequence?: number;
}

export interface AIConnection {
  from: string;
  to: string;
  label?: string;
}

export interface AIData {
  title?: string;
  content_type?: string;
  layout_strategy?: string;
  blocks?: AIBlock[];
  connections?: AIConnection[];
}

// ─── Full color palette (Agent 2 assigns these by name) ─────────────────────
const COLOR_MAP: Record<string, { bg: string; stroke: string; headingText: string }> = {
  blue:   { bg: '#dbeafe', stroke: '#2563eb', headingText: '#1e3a8a' },
  purple: { bg: '#ede9fe', stroke: '#7c3aed', headingText: '#3b0764' },
  yellow: { bg: '#fef9c3', stroke: '#ca8a04', headingText: '#713f12' },
  red:    { bg: '#fee2e2', stroke: '#dc2626', headingText: '#7f1d1d' },
  green:  { bg: '#dcfce7', stroke: '#16a34a', headingText: '#14532d' },
  teal:   { bg: '#ccfbf1', stroke: '#0d9488', headingText: '#134e4a' },
  orange: { bg: '#ffedd5', stroke: '#ea580c', headingText: '#7c2d12' },
  // Fallback mappings for when Agent 2 returns old block types
  definition: { bg: '#dbeafe', stroke: '#2563eb', headingText: '#1e3a8a' },
  concept:    { bg: '#ede9fe', stroke: '#7c3aed', headingText: '#3b0764' },
  example:    { bg: '#fef9c3', stroke: '#ca8a04', headingText: '#713f12' },
  warning:    { bg: '#fee2e2', stroke: '#dc2626', headingText: '#7f1d1d' },
  step:       { bg: '#ffedd5', stroke: '#ea580c', headingText: '#7c2d12' },
  answer:     { bg: '#dcfce7', stroke: '#16a34a', headingText: '#14532d' },
  formula:    { bg: '#ccfbf1', stroke: '#0d9488', headingText: '#134e4a' },
};

const COLUMN_WIDTH = 460;
const GAP_X        = 60;
const GAP_Y        = 44;
const PADDING      = 22;

// ─── Word wrap preserving existing newlines ──────────────────────────────────
function wrapText(text: string, maxCharsPerLine: number): string {
  if (!text) return '';
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if (line.trim() === '') { result.push(''); continue; }
    const words = line.split(' ');
    let current = '';
    for (const word of words) {
      if ((current + word).length > maxCharsPerLine) {
        if (current) result.push(current.trim());
        current = word + ' ';
      } else {
        current += word + ' ';
      }
    }
    if (current.trim()) result.push(current.trim());
  }

  return result.join('\n');
}

// ─── Build a sticky note (rect + heading + body) ────────────────────────────
function buildStickyNote(
  block: AIBlock,
  x: number,
  y: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const elements: any[] = [];

  // Color: prefer Agent 2's color field, fall back to block.type
  const colorKey = block.color || block.type || 'concept';
  const colors = COLOR_MAP[colorKey] || COLOR_MAP['concept'];

  const heading = wrapText(block.heading || '', 30);
  const body    = wrapText(block.body    || '', 42);

  const headingLines = heading.split('\n').length;
  const bodyLines    = body ? body.split('\n').length : 0;

  // Height: heading(28px/line) + body(24px/line) + padding + buffer
  const boxHeight =
    PADDING * 2 +
    headingLines * 32 +
    (bodyLines > 0 ? bodyLines * 26 + 12 : 0) +
    24; // bottom buffer

  const groupId = generateId();
  const tilt    = (Math.random() - 0.5) * 0.025; // subtle organic tilt

  // 1. Background rectangle
  elements.push(
    generateRectangleElement(x, y, COLUMN_WIDTH, boxHeight, colors.bg, colors.stroke, groupId, tilt)
  );

  // 2. Heading
  elements.push(
    generateTextElement(
      x + PADDING, y + PADDING,
      heading, 22, colors.headingText,
      COLUMN_WIDTH - PADDING * 2,
      groupId, 'left', tilt
    )
  );

  // 3. Body (if it exists)
  if (body) {
    const bodyY = y + PADDING + headingLines * 32 + 8;
    elements.push(
      generateTextElement(
        x + PADDING, bodyY,
        body, 18, '#1e1e2e',
        COLUMN_WIDTH - PADDING * 2,
        groupId, 'left', tilt
      )
    );
  }

  // Attach computed height to block for layout engines to use
  (block as any)._computedHeight = boxHeight;

  return elements;
}

// ─── LAYOUT STRATEGY: Masonry 2-column ──────────────────────────────────────
function layoutMasonry(
  blocks: AIBlock[],
  startY: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const elements: any[] = [];

  const leftX  = -(COLUMN_WIDTH + GAP_X / 2);
  const rightX = GAP_X / 2;

  let leftY  = startY;
  let rightY = startY;

  for (const block of blocks) {
    const [x, y] = leftY <= rightY
      ? [leftX, leftY]
      : [rightX, rightY];

    const noteEls = buildStickyNote(block, x, y);
    elements.push(...noteEls);

    const h = (block as any)._computedHeight + GAP_Y;
    if (leftY <= rightY) leftY  += h;
    else                 rightY += h;
  }

  return elements;
}

// ─── LAYOUT STRATEGY: Top-Down Flow (for process/sequential) ─────────────────
function layoutTopDownFlow(
  blocks: AIBlock[],
  startY: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const elements: any[] = [];

  // Sort by sequence if Agent 2 assigned it
  const sorted = [...blocks].sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999));

  let currentY = startY;
  const centerX = -(COLUMN_WIDTH / 2);

  for (const block of sorted) {
    const noteEls = buildStickyNote(block, centerX, currentY);
    elements.push(...noteEls);
    currentY += ((block as any)._computedHeight + GAP_Y);
  }

  return elements;
}

// ─── LAYOUT STRATEGY: Left-Right (for QA / Comparison) ──────────────────────
function layoutLeftRight(
  blocks: AIBlock[],
  startY: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const elements: any[] = [];

  // Split blocks into two groups: first half = left, second half = right
  const mid   = Math.ceil(blocks.length / 2);
  const left  = blocks.slice(0, mid);
  const right = blocks.slice(mid);

  const leftX  = -(COLUMN_WIDTH + GAP_X);
  const rightX = GAP_X;

  let leftY  = startY;
  let rightY = startY;

  for (const block of left) {
    const noteEls = buildStickyNote(block, leftX, leftY);
    elements.push(...noteEls);
    leftY += (block as any)._computedHeight + GAP_Y;
  }
  for (const block of right) {
    const noteEls = buildStickyNote(block, rightX, rightY);
    elements.push(...noteEls);
    rightY += (block as any)._computedHeight + GAP_Y;
  }

  return elements;
}

// ─── LAYOUT STRATEGY: Hub & Spoke (for concept webs / mind maps) ─────────────
function layoutHubSpoke(
  blocks: AIBlock[],
  startY: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const elements: any[] = [];

  if (blocks.length === 0) return elements;

  // Most important block = hub (center)
  const sorted  = [...blocks].sort((a, b) => {
    const imp = { high: 0, medium: 1, low: 2 };
    return (imp[a.importance as keyof typeof imp] ?? 1) - (imp[b.importance as keyof typeof imp] ?? 1);
  });

  const hub      = sorted[0];
  const spokes   = sorted.slice(1);
  const hubX     = -(COLUMN_WIDTH / 2);
  const hubY     = startY;

  // Hub in center
  elements.push(...buildStickyNote(hub, hubX, hubY));

  // Arrange spokes in a circle around hub
  const hubHeight     = (hub as any)._computedHeight;
  const radius        = 500;
  const hubCenterX    = hubX + COLUMN_WIDTH / 2;
  const hubCenterY    = hubY + hubHeight / 2;

  spokes.forEach((spoke, i) => {
    const angle  = (i / spokes.length) * 2 * Math.PI - Math.PI / 2; // start from top
    const spokeX = hubCenterX + Math.cos(angle) * radius - COLUMN_WIDTH / 2;
    const spokeY = hubCenterY + Math.sin(angle) * radius;
    elements.push(...buildStickyNote(spoke, spokeX, spokeY));
  });

  return elements;
}

// ─── Arrow generator (for connections) ───────────────────────────────────────
function buildArrow(
  fromX: number, fromY: number, fromH: number,
  toX:   number, toY:   number,
  label: string = '',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return {
    id: generateId(),
    type: 'arrow',
    x: fromX + COLUMN_WIDTH / 2,
    y: fromY + fromH,
    width: toX - fromX,
    height: toY - fromY - fromH,
    angle: 0,
    strokeColor: '#6b7280',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0.5,
    opacity: 80,
    groupIds: [],
    roundness: { type: 2 },
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: label ? [{ type: 'text', id: generateId() }] : null,
    updated: Date.now(),
    link: null,
    locked: false,
    points: [[0, 0], [toX - fromX - COLUMN_WIDTH / 2, toY - fromY - fromH]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
  };
}

// ─── MAIN ENTRY POINT ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertAIToCanvas(data: AIData): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];

  if (!data || !data.blocks || !Array.isArray(data.blocks) || data.blocks.length === 0) {
    console.error('[StudyOS] Layout Engine: Invalid AI data', data);
    return elements;
  }

  const blocks   = data.blocks;
  const strategy = data.layout_strategy || 'masonry_2col';
  const startY   = -280;

  // 1. Title
  const titleText = (data.title || 'Study Notes').toUpperCase();
  elements.push(
    generateTextElement(
      -750, -450,
      titleText,
      48, '#1e1e2e', 1500,
      undefined, 'center'
    )
  );

  // 2. Blocks — pick layout strategy from Agent 2's decision
  let blockElements: any[] = [];
  switch (strategy) {
    case 'top_down_flow':
    case 'timeline':
      blockElements = layoutTopDownFlow(blocks, startY);
      break;
    case 'left_right':
      blockElements = layoutLeftRight(blocks, startY);
      break;
    case 'hub_spoke':
      blockElements = layoutHubSpoke(blocks, startY);
      break;
    case 'masonry_2col':
    default:
      blockElements = layoutMasonry(blocks, startY);
      break;
  }
  elements.push(...blockElements);

  // 3. Connections (arrows between blocks)
  // We do a simplified version: draw arrows for top_down_flow layouts
  // For masonry, arrows would cross randomly which looks messy.
  if ((strategy === 'top_down_flow' || strategy === 'timeline') && data.connections?.length) {
    // Build a block position map
    const posMap: Record<string, { x: number; y: number; h: number }> = {};
    const sorted = [...blocks].sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999));
    const centerX = -(COLUMN_WIDTH / 2);
    let currentY = startY;
    for (const b of sorted) {
      posMap[b.id] = { x: centerX, y: currentY, h: (b as any)._computedHeight || 200 };
      currentY += ((b as any)._computedHeight || 200) + GAP_Y;
    }

    for (const conn of data.connections) {
      const from = posMap[conn.from];
      const to   = posMap[conn.to];
      if (from && to && to.y > from.y) {
        elements.push(buildArrow(from.x, from.y, from.h, to.x, to.y, conn.label || ''));
      }
    }
  }

  return elements;
}
