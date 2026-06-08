"use client";

import dynamic from "next/dynamic";

const ExcalidrawCanvas = dynamic(() => import("@/components/ExcalidrawCanvas"), {
  ssr: false,
});

export default function SplitView() {
  return (
    <div style={{ flex: 1, width: "100%", height: "100%", overflow: "hidden" }}>
      <ExcalidrawCanvas />
    </div>
  );
}
