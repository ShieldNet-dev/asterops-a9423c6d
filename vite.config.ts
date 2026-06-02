// Vanilla TanStack Start config targeting Node.js (for Vercel).
// NOTE: Removing the Lovable Cloudflare-bundled config means the Lovable
// preview/published site will no longer build; deploy via Vercel instead.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    alias: { "@": "/src" },
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      start: { entry: "server" },
    }),
    viteReact(),
  ],
});