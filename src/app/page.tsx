import type { Metadata } from "next";
import PastePage from "@/components/PastePage";

export const metadata: Metadata = {
  title: "StudyOS — Paste & Generate",
  description: "Paste any AI-generated content and get stunning, structured study notes instantly.",
};

export default function Home() {
  return <PastePage />;
}
