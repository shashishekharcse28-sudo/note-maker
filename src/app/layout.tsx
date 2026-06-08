import type { Metadata } from "next";
import { Caveat, Inter } from "next/font/google";
import "./globals.css";

// Caveat — beautiful casual handwriting, perfect for a note-taking app.
// next/font automatically self-hosts and optimises the font (zero layout shift).
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

// Inter — clean sans-serif kept for UI chrome (buttons, labels, nav).
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning
      className={`${caveat.variable} ${inter.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`antialiased ${caveat.className}`}>{children}</body>
    </html>
  );
}
