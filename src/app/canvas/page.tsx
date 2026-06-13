import type { Metadata } from "next";
import CanvasClient from "./CanvasClient";

export const metadata: Metadata = {
  title: "StudyOS — Canvas",
  description: "Full-screen freeform drawing canvas powered by Excalidraw.",
};

export default function CanvasPage() {
  return <CanvasClient />;
}
