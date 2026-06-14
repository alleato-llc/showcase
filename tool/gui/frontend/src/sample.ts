import type { Project, ThemeSettings } from "./types";

// Used only when the frontend runs outside Wails (browser dev / screenshots).
export const sample: Project[] = [
  {
    title: "Soroban",
    emoji: "🧮",
    headline: "An exact calculator with a spreadsheet attached.",
    site: "https://soroban.alleato.dev",
    repo: "https://github.com/alleato-llc/soroban",
  },
  {
    title: "Recommended Books",
    emoji: "📚",
    headline: "A static site generator and Electron admin app for book recommendations.",
    repo: "https://github.com/nycjv321/recommended-books",
  },
  {
    title: "dr",
    emoji: "🎚️",
    headline: "A dynamic range meter for audio files — in two languages.",
    implementations: [
      { label: "Rust", repo: "https://github.com/alleato-llc/dr" },
      { label: "Swift", repo: "https://github.com/alleato-llc/dr-kit" },
    ],
  },
  {
    title: "lorem-ipsum",
    emoji: "📝",
    headline: "A Markov-chain lorem ipsum generator with three front ends over one Rust core.",
    repo: "https://github.com/alleato-llc/lorem-ipsum",
  },
];

export const sampleThemes: ThemeSettings = {
  default: "dracula",
  defaultFont: "caveat",
  themes: [
    {
      id: "solarized-light",
      name: "Solarized Light",
      mode: "light",
      colors: { bg: "#fdf6e3", surface: "#eee8d5", text: "#073642", muted: "#657b83", faint: "#93a1a1", accent: "#268bd2", error: "#dc322f", border: "rgba(7,54,66,0.12)", shadow: "rgba(7,54,66,0.06)" },
    },
    {
      id: "dracula",
      name: "Dracula",
      mode: "dark",
      colors: { bg: "#1e1e2e", surface: "#343746", text: "#f8f8f2", muted: "#bd93f9", faint: "#6272a4", accent: "#ff79c6", error: "#ff5555", border: "rgba(248,248,242,0.1)", shadow: "rgba(0,0,0,0.3)" },
    },
  ],
  fonts: [
    { id: "system", name: "System", stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
    { id: "serif", name: "Serif", stack: "Georgia, 'Times New Roman', serif" },
    { id: "mono", name: "Mono", stack: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" },
    { id: "caveat", name: "Caveat (handwritten)", stack: "'Caveat', cursive", family: "Caveat", url: "/fonts/caveat.woff2", weight: "400 700" },
  ],
};
