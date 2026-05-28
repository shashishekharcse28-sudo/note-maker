import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyOS — Your Second Brain",
  description: "A next-generation study application combining rich-text note-taking with a freeform digital whiteboard.",
  keywords: ["notes", "whiteboard", "study", "tiptap", "excalidraw"],
  openGraph: {
    title: "StudyOS — Your Second Brain",
    description: "Notes + Whiteboard, unified.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
