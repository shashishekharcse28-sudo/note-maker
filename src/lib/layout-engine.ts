import { generateId, generateTextElement, generateRectangleElement } from './excalidraw-generator';

export interface AIData {
  title: string;
  blocks: {
    type: 'definition' | 'concept' | 'example' | 'warning';
    heading: string;
    body: string;
  }[];
}

const COLOR_MAP = {
  definition: { bg: "#e0f2fe", stroke: "#0284c7", text: "#0c4a6e" }, // Blue
  concept:    { bg: "#f3e8ff", stroke: "#9333ea", text: "#3b0764" }, // Purple
  example:    { bg: "#fef08a", stroke: "#ca8a04", text: "#713f12" }, // Yellow
  warning:    { bg: "#fee2e2", stroke: "#dc2626", text: "#7f1d1d" }  // Red
};

export function convertAIToCanvas(data: AIData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];
  
  let currentX = 0;
  let currentY = -400;
  
  // 1. Generate the Main Title (Handwritten text, large)
  const titleElem = generateTextElement(
    currentX, currentY, 
    data.title.toUpperCase(), 
    40, "#e2e2ef", 600
  );
  elements.push(titleElem);
  
  currentY += 120; // Move down 120px for the first block
  
  // 2. Loop through each AI generated block and map it spatially
  for (const block of data.blocks) {
    const groupId = generateId();
    const colors = COLOR_MAP[block.type] || COLOR_MAP.concept;
    
    const boxWidth = 450;
    const padding = 24;
    
    // Approximate Height Calculation
    // Excalidraw text wrapping is complex, so we approximate based on character count.
    const headingCharsPerLine = 35;
    const bodyCharsPerLine = 50;
    
    const headingLines = Math.ceil(block.heading.length / headingCharsPerLine);
    const bodyLines = Math.ceil(block.body.length / bodyCharsPerLine);
    
    // 28px height per heading line, 24px height per body line
    const boxHeight = (padding * 2) + (headingLines * 28) + (bodyLines * 24) + 16;
    
    // Create the Sticky Note Background
    elements.push(generateRectangleElement(
      currentX, currentY, 
      boxWidth, boxHeight, 
      colors.bg, colors.stroke, 
      groupId
    ));
    
    // Create the Heading Text inside the sticky note
    elements.push(generateTextElement(
      currentX + padding, currentY + padding, 
      block.heading, 
      24, colors.text, boxWidth - padding * 2, 
      groupId
    ));
    
    // Create the Body Text below the heading
    elements.push(generateTextElement(
      currentX + padding, currentY + padding + (headingLines * 28) + 8, 
      block.body, 
      20, "#1e1e28", boxWidth - padding * 2, 
      groupId
    ));
    
    // Move down for the next block, adding a 40px gap between sticky notes
    currentY += boxHeight + 40;
  }
  
  return elements;
}
