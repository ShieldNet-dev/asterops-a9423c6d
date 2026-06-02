// Vanilla TanStack Start config targeting Node.js (for Vercel).
// NOTE: Removing the Lovable Cloudflare-bundled config means the Lovable
// preview/published site will no longer build; deploy via Vercel instead.
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
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