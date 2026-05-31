"use client";

import dynamic from "next/dynamic";

const ExcalidrawCanvas = dynamic(() => import("@/components/ExcalidrawCanvas"), {
  ssr: false,
});

// ─── Full-screen Whiteboard ───────────────────────────────────────────────────
export default function SplitView() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
        width: "100%",
        background: "#ffffff",
      }}
    >
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <ExcalidrawCanvas />
      </div>
    </div>
  );
}
