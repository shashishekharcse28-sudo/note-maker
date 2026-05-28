import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import SplitView from "@/components/SplitView";

export const metadata: Metadata = {
  title: "StudyOS — Split View",
  description: "Combine rich-text notes with a freeform digital whiteboard in one seamless workspace.",
};

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--surface-0)",
      }}
    >
      <NavBar />
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <SplitView />
      </div>
    </main>
  );
}
