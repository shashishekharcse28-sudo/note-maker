export function getViewportCenter(excalidrawAPI: any) {
  const { scrollX, scrollY, zoom } = excalidrawAPI.getAppState();
  const canvas = document.querySelector('.excalidraw__canvas');
  const rect = canvas ? canvas.getBoundingClientRect() : { width: 800, height: 600 };
  return {
    x: (-scrollX + rect.width / 2) / zoom.value,
    y: (-scrollY + rect.height / 2) / zoom.value,
  };
}

export function baseElement(overrides: any) {
  return {
    id: crypto.randomUUID(),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1e9),
    isDeleted: false,
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 1e9),
    link: null,
    locked: false,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    ...overrides,
  };
}

export function createTriangle(excalidrawAPI: any, options: any = {}) {
  const { x, y } = getViewportCenter(excalidrawAPI);
  const w = options.w || 160;
  const h = options.h || 140;
  const cx = x - w / 2, cy = y - h / 2;

  const shared = {
    strokeColor: options.strokeColor || '#000000',
    backgroundColor: options.backgroundColor || 'transparent',
    strokeWidth: options.strokeWidth || 2,
    strokeStyle: options.strokeStyle || 'solid',
    roughness: options.roughness ?? 1,
  };

  const groupId = crypto.randomUUID();

  const lines = [
    { x1: cx + w / 2, y1: cy, x2: cx + w, y2: cy + h },
    { x1: cx + w, y1: cy + h, x2: cx, y2: cy + h },
    { x1: cx, y1: cy + h, x2: cx + w / 2, y2: cy },
  ].map(({ x1, y1, x2, y2 }) => baseElement({
    ...shared,
    type: 'line',
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    points: [[0, 0], [x2 - x1, y2 - y1]],
    groupIds: [groupId],
  }));

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), ...lines]
  });
}

export function createRoundedRect(excalidrawAPI: any, options: any = {}) {
  const { x, y } = getViewportCenter(excalidrawAPI);
  const w = options.w || 200;
  const h = options.h || 120;

  const el = baseElement({
    type: 'rectangle',
    x: x - w / 2,
    y: y - h / 2,
    width: w,
    height: h,
    strokeColor: options.strokeColor || '#000000',
    backgroundColor: options.backgroundColor || 'transparent',
    strokeWidth: options.strokeWidth || 2,
    strokeStyle: options.strokeStyle || 'solid',
    roughness: options.roughness ?? 1,
    roundness: { type: 3, value: 32 },
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), el]
  });
}

export function createParallelogram(excalidrawAPI: any, options: any = {}) {
  const { x, y } = getViewportCenter(excalidrawAPI);
  const w = options.w || 200;
  const h = options.h || 100;
  const skew = w * 0.2;
  const cx = x - w / 2, cy = y - h / 2;

  const groupId = crypto.randomUUID();
  const shared = {
    strokeColor: options.strokeColor || '#000000',
    backgroundColor: options.backgroundColor || 'transparent',
    strokeWidth: options.strokeWidth || 2,
    strokeStyle: options.strokeStyle || 'solid',
    roughness: options.roughness ?? 1,
    groupIds: [groupId],
  };

  const corners = [
    [cx + skew, cy],
    [cx + w, cy],
    [cx + w - skew, cy + h],
    [cx, cy + h],
  ];

  const lines = corners.map((start, i) => {
    const end = corners[(i + 1) % 4];
    return baseElement({
      ...shared,
      type: 'line',
      x: start[0],
      y: start[1],
      width: end[0] - start[0],
      height: end[1] - start[1],
      points: [[0, 0], [end[0] - start[0], end[1] - start[1]]],
    });
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), ...lines]
  });
}

export function createTrapezoid(excalidrawAPI: any, options: any = {}) {
  const { x, y } = getViewportCenter(excalidrawAPI);
  const w = options.w || 200;
  const h = options.h || 100;
  const inset = w * 0.18;
  const cx = x - w / 2, cy = y - h / 2;

  const groupId = crypto.randomUUID();
  const corners = [
    [cx + inset, cy],
    [cx + w - inset, cy],
    [cx + w, cy + h],
    [cx, cy + h],
  ];

  const lines = corners.map((start, i) => {
    const end = corners[(i + 1) % 4];
    return baseElement({
      type: 'line',
      x: start[0],
      y: start[1],
      width: end[0] - start[0],
      height: end[1] - start[1],
      points: [[0, 0], [end[0] - start[0], end[1] - start[1]]],
      strokeColor: options.strokeColor || '#000000',
      backgroundColor: options.backgroundColor || 'transparent',
      strokeWidth: options.strokeWidth || 2,
      strokeStyle: options.strokeStyle || 'solid',
      roughness: options.roughness ?? 1,
      groupIds: [groupId],
    });
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), ...lines]
  });
}

export function createStadium(excalidrawAPI: any, options: any = {}) {
  const { x, y } = getViewportCenter(excalidrawAPI);
  const w = options.w || 200;
  const h = options.h || 80;

  const el = baseElement({
    type: 'rectangle',
    x: x - w / 2,
    y: y - h / 2,
    width: w,
    height: h,
    strokeColor: options.strokeColor || '#000000',
    backgroundColor: options.backgroundColor || 'transparent',
    strokeWidth: options.strokeWidth || 2,
    strokeStyle: options.strokeStyle || 'solid',
    roughness: options.roughness ?? 1,
    roundness: { type: 3, value: h / 2 },
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), el]
  });
}

export function createCross(excalidrawAPI: any, options: any = {}) {
  const { x, y } = getViewportCenter(excalidrawAPI);
  const size = options.size || 120;
  const t = size * 0.3;
  const groupId = crypto.randomUUID();

  const shared = {
    strokeColor: options.strokeColor || '#000000',
    backgroundColor: options.backgroundColor || 'transparent',
    strokeWidth: options.strokeWidth || 2,
    strokeStyle: options.strokeStyle || 'solid',
    roughness: options.roughness ?? 1,
    groupIds: [groupId],
  };

  const vert = baseElement({
    ...shared,
    type: 'rectangle',
    x: x - t / 2,
    y: y - size / 2,
    width: t,
    height: size,
  });

  const horiz = baseElement({
    ...shared,
    type: 'rectangle',
    x: x - size / 2,
    y: y - t / 2,
    width: size,
    height: t,
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), vert, horiz]
  });
}

export function createRegularPolygon(excalidrawAPI: any, sides: number, options: any = {}) {
  const { x, y } = getViewportCenter(excalidrawAPI);
  const r = options.r || 80;
  const rotation = sides === 5 ? -Math.PI / 2 : 0;
  const groupId = crypto.randomUUID();

  const corners = Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2 + rotation;
    return [x + r * Math.cos(angle), y + r * Math.sin(angle)];
  });

  const lines = corners.map((start, i) => {
    const end = corners[(i + 1) % sides];
    return baseElement({
      type: 'line',
      x: start[0],
      y: start[1],
      width: end[0] - start[0],
      height: end[1] - start[1],
      points: [[0, 0], [end[0] - start[0], end[1] - start[1]]],
      strokeColor: options.strokeColor || '#000000',
      backgroundColor: options.backgroundColor || 'transparent',
      strokeWidth: options.strokeWidth || 2,
      strokeStyle: options.strokeStyle || 'solid',
      roughness: options.roughness ?? 1,
      groupIds: [groupId],
    });
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), ...lines]
  });
}
