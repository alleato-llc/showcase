// @ts-check
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";

export default defineConfig({
  integrations: [preact()],
  // Emit flat files (about.html, not about/index.html) so extensionless URLs
  // resolve under static hosts that append `.html` rather than `/index.html`.
  // Matches the soroban site this theme is lifted from.
  build: { format: "file" },
});
