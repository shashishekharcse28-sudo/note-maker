"use client";

import "@excalidraw/excalidraw/index.css";

import { useState } from "react";
import dynamic from "next/dynamic";
import MyColorsPanel from "./MyColorsPanel";

const ExcalidrawWithMenu = dynamic(
  async () => {
    const { Excalidraw, MainMenu } = await import("@excalidraw/excalidraw");
    function Canvas(props: any) {
      return (
        <Excalidraw {...props}>
          <MainMenu>
            <MainMenu.DefaultItems.LoadScene />
            <MainMenu.DefaultItems.SaveToActiveFile />
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.Separator />
            <MainMenu.DefaultItems.ToggleTheme />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
        </Excalidraw>
      );
    }
    return Canvas;
  },
  {
    ssr: false,
    loading: () => (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", color: "#6366f1", flexDirection: "column", gap: "12px" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ animation: "ex-spin 1.2s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <style>{`@keyframes ex-spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "0.8rem", color: "#888", fontFamily: "Inter, sans-serif" }}>Loading canvas…</span>
      </div>
    ),
  }
);

export default function ExcalidrawCanvas() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <style>{`
        .excalidraw [aria-label="Excalidraw+"],
        button[title="Excalidraw+"],
        a[title="Excalidraw+"]                { display: none !important; }

        .excalidraw [data-testid="collab-button"],
        button[title="Share"]                  { display: none !important; }

        .excalidraw .ToolIcon__lock,
        .excalidraw [data-testid="lock-button"],
        .excalidraw [data-testid="hand"],
        .excalidraw .panning-tool              { display: none !important; }

        .excalidraw .footer-center             { display: none !important; }

        .excalidraw .App-menu__left {
          margin-top: calc(var(--my-colors-panel-height, 111px) - 12px) !important;
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
          border-top: none !important;
        }

        .excalidraw [data-testid="mermaid-to-excalidraw"],
        .excalidraw button[title*="Mermaid"],
        .excalidraw button[aria-label*="Mermaid"],
        .excalidraw [data-testid="toolbar-magic"],
        .excalidraw [data-testid="toolbar-magic-button"],
        .excalidraw [aria-label="Magic"],
        .excalidraw .dropdown-menu-item:has(svg.mermaid-logo) {
          display: none !important;
        }
      `}</style>

      <ExcalidrawWithMenu
        theme="light"
        excalidrawAPI={(api: any) => {
          if (typeof window !== "undefined" && api) (window as any).EXC = api;
          setExcalidrawAPI(api);
        }}
        UIOptions={{
          canvasActions: {
            saveAsImage: true,
            export: { saveFileToDisk: true },
            toggleTheme: false,
          },
        }}
      />

      <MyColorsPanel excalidrawAPI={excalidrawAPI} />
    </div>
  );
}
