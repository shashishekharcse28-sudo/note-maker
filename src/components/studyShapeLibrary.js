const baseProps = (id, groupIds, seed) => ({
  id,
  version: 1,
  versionNonce: 98765,
  isDeleted: false,
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 100,
  groupIds,
  frameId: null,
  roundness: null,
  seed,
  link: null,
  locked: false,
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  updated: 1700000000000,
});

export const LIBRARY_ITEMS = [
  {
    id: "study-triangle",
    status: "published",
    createdAt: 1700000000000,
    name: "Triangle",
    elements: [
      {
        ...baseProps("tri-l1", ["tri-group"], 11001),
        type: "line",
        x: 0, y: -70, width: 80, height: 140,
        points: [[0, 0], [80, 140]],
        angle: 0,
      },
      {
        ...baseProps("tri-l2", ["tri-group"], 11002),
        type: "line",
        x: 80, y: 70, width: 160, height: 0,
        points: [[0, 0], [-160, 0]],
        angle: 0,
      },
      {
        ...baseProps("tri-l3", ["tri-group"], 11003),
        type: "line",
        x: -80, y: 70, width: 80, height: 140,
        points: [[0, 0], [80, -140]],
        angle: 0,
      }
    ]
  },
  {
    id: "study-rounded-rect",
    status: "published",
    createdAt: 1700000000000,
    name: "Rounded Rectangle",
    elements: [
      {
        ...baseProps("rrect-1", ["rrect-group"], 12001),
        type: "rectangle",
        x: -100, y: -60, width: 200, height: 120,
        angle: 0,
        roundness: { type: 3, value: 32 },
      }
    ]
  },
  {
    id: "study-parallelogram",
    status: "published",
    createdAt: 1700000000000,
    name: "Parallelogram",
    elements: [
      { ...baseProps("pll-l1", ["pll-group"], 13001), type: "line", x: -60, y: -50, width: 160, height: 0, points: [[0, 0], [160, 0]], angle: 0 },
      { ...baseProps("pll-l2", ["pll-group"], 13002), type: "line", x: 100, y: -50, width: 40, height: 100, points: [[0, 0], [-40, 100]], angle: 0 },
      { ...baseProps("pll-l3", ["pll-group"], 13003), type: "line", x: 60, y: 50, width: 160, height: 0, points: [[0, 0], [-160, 0]], angle: 0 },
      { ...baseProps("pll-l4", ["pll-group"], 13004), type: "line", x: -100, y: 50, width: 40, height: 100, points: [[0, 0], [40, -100]], angle: 0 }
    ]
  },
  {
    id: "study-trapezoid",
    status: "published",
    createdAt: 1700000000000,
    name: "Trapezoid",
    elements: [
      { ...baseProps("trap-l1", ["trap-group"], 14001), type: "line", x: -64, y: -50, width: 128, height: 0, points: [[0, 0], [128, 0]], angle: 0 },
      { ...baseProps("trap-l2", ["trap-group"], 14002), type: "line", x: 64, y: -50, width: 36, height: 100, points: [[0, 0], [36, 100]], angle: 0 },
      { ...baseProps("trap-l3", ["trap-group"], 14003), type: "line", x: 100, y: 50, width: 200, height: 0, points: [[0, 0], [-200, 0]], angle: 0 },
      { ...baseProps("trap-l4", ["trap-group"], 14004), type: "line", x: -100, y: 50, width: 36, height: 100, points: [[0, 0], [36, -100]], angle: 0 }
    ]
  },
  {
    id: "study-stadium",
    status: "published",
    createdAt: 1700000000000,
    name: "Stadium",
    elements: [
      {
        ...baseProps("stad-1", ["stad-group"], 15001),
        type: "rectangle",
        x: -100, y: -40, width: 200, height: 80,
        angle: 0,
        roundness: { type: 3, value: 40 },
      }
    ]
  },
  {
    id: "study-cross",
    status: "published",
    createdAt: 1700000000000,
    name: "Cross",
    elements: [
      { ...baseProps("crss-1", ["crss-group"], 16001), type: "rectangle", x: -18, y: -60, width: 36, height: 120, angle: 0 },
      { ...baseProps("crss-2", ["crss-group"], 16002), type: "rectangle", x: -60, y: -18, width: 120, height: 36, angle: 0 }
    ]
  },
  {
    id: "study-pentagon",
    status: "published",
    createdAt: 1700000000000,
    name: "Pentagon",
    elements: [
      { ...baseProps("pent-l1", ["pent-group"], 17001), type: "line", x: 0, y: -80, width: 76.0845, height: 55.2786, points: [[0, 0], [76.0845, 55.2786]], angle: 0 },
      { ...baseProps("pent-l2", ["pent-group"], 17002), type: "line", x: 76.0845, y: -24.7214, width: 29.0617, height: 89.4428, points: [[0, 0], [-29.0617, 89.4428]], angle: 0 },
      { ...baseProps("pent-l3", ["pent-group"], 17003), type: "line", x: 47.0228, y: 64.7214, width: 94.0456, height: 0, points: [[0, 0], [-94.0456, 0]], angle: 0 },
      { ...baseProps("pent-l4", ["pent-group"], 17004), type: "line", x: -47.0228, y: 64.7214, width: 29.0617, height: 89.4428, points: [[0, 0], [-29.0617, -89.4428]], angle: 0 },
      { ...baseProps("pent-l5", ["pent-group"], 17005), type: "line", x: -76.0845, y: -24.7214, width: 76.0845, height: 55.2786, points: [[0, 0], [76.0845, -55.2786]], angle: 0 }
    ]
  },
  {
    id: "study-hexagon",
    status: "published",
    createdAt: 1700000000000,
    name: "Hexagon",
    elements: [
      { ...baseProps("hex-l1", ["hex-group"], 18001), type: "line", x: 80, y: 0, width: 40, height: 69.282, points: [[0, 0], [-40, 69.282]], angle: 0 },
      { ...baseProps("hex-l2", ["hex-group"], 18002), type: "line", x: 40, y: 69.282, width: 80, height: 0, points: [[0, 0], [-80, 0]], angle: 0 },
      { ...baseProps("hex-l3", ["hex-group"], 18003), type: "line", x: -40, y: 69.282, width: 40, height: 69.282, points: [[0, 0], [-40, -69.282]], angle: 0 },
      { ...baseProps("hex-l4", ["hex-group"], 18004), type: "line", x: -80, y: 0, width: 40, height: 69.282, points: [[0, 0], [40, -69.282]], angle: 0 },
      { ...baseProps("hex-l5", ["hex-group"], 18005), type: "line", x: -40, y: -69.282, width: 80, height: 0, points: [[0, 0], [80, 0]], angle: 0 },
      { ...baseProps("hex-l6", ["hex-group"], 18006), type: "line", x: 40, y: -69.282, width: 40, height: 69.282, points: [[0, 0], [40, 69.282]], angle: 0 }
    ]
  },
  {
    id: "study-cylinder",
    status: "published",
    createdAt: 1700000000000,
    name: "Cylinder",
    elements: [
      { ...baseProps("cyl-top", ["cyl-group"], 19001), type: "ellipse", x: -60, y: -80, width: 120, height: 30, angle: 0 },
      { ...baseProps("cyl-bot", ["cyl-group"], 19002), type: "ellipse", x: -60, y: 50, width: 120, height: 30, angle: 0 },
      { ...baseProps("cyl-l", ["cyl-group"], 19003), type: "line", x: -60, y: -65, width: 0, height: 130, points: [[0, 0], [0, 130]], angle: 0 },
      { ...baseProps("cyl-r", ["cyl-group"], 19004), type: "line", x: 60, y: -65, width: 0, height: 130, points: [[0, 0], [0, 130]], angle: 0 }
    ]
  },
  {
    id: "study-star",
    status: "published",
    createdAt: 1700000000000,
    name: "Star",
    elements: [
      { ...baseProps("str-l1", ["str-group"], 20001), type: "line", x: 0, y: -80, width: 19.985, height: 52.494, points: [[0, 0], [19.985, 52.494]], angle: 0 },
      { ...baseProps("str-l2", ["str-group"], 20002), type: "line", x: 19.985, y: -27.506, width: 56.1, height: 2.785, points: [[0, 0], [56.1, 2.785]], angle: 0 },
      { ...baseProps("str-l3", ["str-group"], 20003), type: "line", x: 76.085, y: -24.721, width: 43.749, height: 35.227, points: [[0, 0], [-43.749, 35.227]], angle: 0 },
      { ...baseProps("str-l4", ["str-group"], 20004), type: "line", x: 32.336, y: 10.506, width: 14.687, height: 54.215, points: [[0, 0], [14.687, 54.215]], angle: 0 },
      { ...baseProps("str-l5", ["str-group"], 20005), type: "line", x: 47.023, y: 64.721, width: 47.023, height: 30.721, points: [[0, 0], [-47.023, -30.721]], angle: 0 },
      { ...baseProps("str-l6", ["str-group"], 20006), type: "line", x: 0, y: 34, width: 47.023, height: 30.721, points: [[0, 0], [-47.023, 30.721]], angle: 0 },
      { ...baseProps("str-l7", ["str-group"], 20007), type: "line", x: -47.023, y: 64.721, width: 14.687, height: 54.215, points: [[0, 0], [14.687, -54.215]], angle: 0 },
      { ...baseProps("str-l8", ["str-group"], 20008), type: "line", x: -32.336, y: 10.506, width: 43.749, height: 35.227, points: [[0, 0], [-43.749, -35.227]], angle: 0 },
      { ...baseProps("str-l9", ["str-group"], 20009), type: "line", x: -76.085, y: -24.721, width: 56.1, height: 2.785, points: [[0, 0], [56.1, -2.785]], angle: 0 },
      { ...baseProps("str-l10", ["str-group"], 20010), type: "line", x: -19.985, y: -27.506, width: 19.985, height: 52.494, points: [[0, 0], [19.985, -52.494]], angle: 0 }
    ]
  },
  {
    id: "study-callout",
    status: "published",
    createdAt: 1700000000000,
    name: "Callout",
    elements: [
      {
        ...baseProps("call-body", ["call-group"], 21001),
        type: "rectangle",
        x: -100, y: -60, width: 200, height: 120,
        angle: 0,
        roundness: { type: 3, value: 16 }
      },
      { ...baseProps("call-t1", ["call-group"], 21002), type: "line", x: -60, y: 60, width: 30, height: 50, points: [[0, 0], [-30, 50]], angle: 0 },
      { ...baseProps("call-t2", ["call-group"], 21003), type: "line", x: -90, y: 110, width: 60, height: 50, points: [[0, 0], [60, -50]], angle: 0 },
      { ...baseProps("call-t3", ["call-group"], 21004), type: "line", x: -30, y: 60, width: 30, height: 0, points: [[0, 0], [-30, 0]], angle: 0 }
    ]
  },
  {
    id: "study-document",
    status: "published",
    createdAt: 1700000000000,
    name: "Document",
    elements: [
      { ...baseProps("doc-l1", ["doc-group"], 22001), type: "line", x: -80, y: -90, width: 160, height: 0, points: [[0, 0], [160, 0]], angle: 0 },
      { ...baseProps("doc-l2", ["doc-group"], 22002), type: "line", x: -80, y: -90, width: 0, height: 162, points: [[0, 0], [0, 162]], angle: 0 },
      { ...baseProps("doc-l3", ["doc-group"], 22003), type: "line", x: 80, y: -90, width: 0, height: 162, points: [[0, 0], [0, 162]], angle: 0 },
      { 
        ...baseProps("doc-l4", ["doc-group"], 22004), 
        type: "line", 
        x: -80, y: 72, width: 160, height: 30, 
        points: [[0, 0], [40, -12], [80, 18], [120, -12], [160, 0]], 
        angle: 0,
        roundness: { type: 3, value: 32 }
      }
    ]
  }
];
