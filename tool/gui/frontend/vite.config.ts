import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Wails embeds frontend/dist; emit relative asset paths so it works under the
// asset server. The dev server is used by `wails dev`.
export default defineConfig({
  plugins: [preact()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
});
