export function generateId() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export function generateTextElement(
  x: number, y: number, text: string, fontSize: number, 
  color: string, width: number, groupId?: string
) {
  return {
    id: generateId(),
    type: "text",
    x,
    y,
    width,
    height: fontSize * 1.25 * Math.max(1, text.split('\n').length),
    angle: 0,
    strokeColor: color,
    backgroundColor: "transparent",
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: groupId ? [groupId] : [],
    roundness: null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text,
    fontSize,
    fontFamily: 1, // 1 is Virgil (Handwritten default in Excalidraw)
    textAlign: "left",
    verticalAlign: "top",
    baseline: fontSize - 4,
    lineHeight: 1.25,
    originalText: text,
    containerId: null,
  };
}

export function generateRectangleElement(
  x: number, y: number, width: number, height: number, 
  bgColor: string, strokeColor: string, groupId?: string
) {
  return {
    id: generateId(),
    type: "rectangle",
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor,
    backgroundColor: bgColor,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0.5,
    opacity: 100,
    groupIds: groupId ? [groupId] : [],
    roundness: { type: 3 }, // Type 3 is curved/rounded edges
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}
