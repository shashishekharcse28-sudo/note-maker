import { generateId, generateTextElement, generateRectangleElement } from './excalidraw-generator';

export interface AIData {
  title?: string;
  blocks?: {
    type?: 'definition' | 'concept' | 'example' | 'warning';
    heading?: string;
    body?: string;
  }[];
}

const COLOR_MAP: Record<string, { bg: string, stroke: string, text: string }> = {
  definition: { bg: "#e0f2fe", stroke: "#0284c7", text: "#0c4a6e" }, // Blue
  concept:    { bg: "#f3e8ff", stroke: "#9333ea", text: "#3b0764" }, // Purple
  example:    { bg: "#fef08a", stroke: "#ca8a04", text: "#713f12" }, // Yellow
  warning:    { bg: "#fee2e2", stroke: "#dc2626", text: "#7f1d1d" }  // Red
};

function wrapText(text: string, maxCharsPerLine: number): string {
  if (!text) return "";
  const lines = text.split('\n');
  const wrappedLines = lines.map(line => {
    const words = line.split(' ');
    let wrapped = '';
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if ((currentLine + word).length > maxCharsPerLine) {
        wrapped += currentLine.trim() + '\n';
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    wrapped += currentLine.trim();
    return wrapped;
  });
  return wrappedLines.join('\n');
}

export function convertAIToCanvas(data: AIData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];
  
  if (!data || !data.blocks || !Array.isArray(data.blocks)) {
    console.error("Invalid AI data format received", data);
    return elements;
  }
  
  // 1. Generate the Main Title (Handwritten text, large, centered)
  const titleText = (data.title || "Study Notes").toUpperCase();
  const titleElem = generateTextElement(
    0, -400, 
    titleText, 
    48, "#e2e2ef", 3000
  );
  
  // Excalidraw text is left-aligned by our generator, so we center it mathematically by shifting X
  // Rough estimate of text width: chars * (fontSize * 0.5)
  const titleEstWidth = titleText.length * 24; 
  titleElem.x = -(titleEstWidth / 2);
  elements.push(titleElem);
  
  // ── MASONRY 2-COLUMN LAYOUT ENGINE ──
  // Instead of a boring vertical list, we spawn sticky notes in 2 columns.
  const columnWidth = 450;
  const gapX = 60; // Gap between columns
  const gapY = 40; // Gap vertically
  
  // The X coordinate for the left and right columns
  const leftColX = -(columnWidth + (gapX / 2));
  const rightColX = (gapX / 2);
  
  // Track the current Y position of the bottom of each column
  let leftY = -280;
  let rightY = -280;
  
  for (const block of data.blocks) {
    if (!block.heading && !block.body) continue;

    const groupId = generateId();
    const typeKey = block.type && COLOR_MAP[block.type] ? block.type : 'concept';
    const colors = COLOR_MAP[typeKey];
    
    const padding = 24;
    const rawHeading = block.heading || "";
    const rawBody = block.body || "";
    
    // ── Safe Text Wrapping & Height Calculation ──
    const heading = wrapText(rawHeading, 30); // Font size 24 -> ~30 chars
    const body = wrapText(rawBody, 38);       // Font size 20 -> ~38 chars
    
    const headingLines = heading.split('\n').length;
    const bodyLines = body ? body.split('\n').length : 0;
    
    // Calculate box height dynamically based on the exact wrapped lines
    const headingHeight = headingLines * 30; // 24px * 1.25
    const bodyHeight = bodyLines * 25;       // 20px * 1.25
    const gap = body ? 16 : 0;
    
    const boxHeight = (padding * 2) + headingHeight + gap + bodyHeight + 32; // 32px safety margin
    
    // ── Decide which column to put this block in (the shorter one) ──
    let currentX: number;
    let currentY: number;
    
    if (leftY <= rightY) {
      currentX = leftColX;
      currentY = leftY;
      leftY += boxHeight + gapY;
    } else {
      currentX = rightColX;
      currentY = rightY;
      rightY += boxHeight + gapY;
    }
    
    // Create the Sticky Note Background
    elements.push(generateRectangleElement(
      currentX, currentY, 
      columnWidth, boxHeight, 
      colors.bg, colors.stroke, 
      groupId
    ));
    
    // Create the Heading Text inside the sticky note
    if (heading) {
      elements.push(generateTextElement(
        currentX + padding, currentY + padding, 
        heading, 
        24, colors.text, columnWidth - padding * 2, 
        groupId
      ));
    }
    
    // Create the Body Text below the heading
    if (body) {
      elements.push(generateTextElement(
        currentX + padding, currentY + padding + headingHeight + gap, 
        body, 
        20, "#1e1e28", columnWidth - padding * 2, 
        groupId
      ));
    }
  }
  
  return elements;
}
