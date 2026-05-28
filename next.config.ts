import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Excalidraw uses browser-only APIs; transpile so Next.js can handle imports
  transpilePackages: ["@excalidraw/excalidraw"],
  // Empty turbopack config silences the Turbopack/webpack conflict warning
  turbopack: {},
};

export default nextConfig;
