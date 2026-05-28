"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(true); // default dark

  useEffect(() => {
    // Sync with system preference on mount
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return { isDark, setIsDark };
}
