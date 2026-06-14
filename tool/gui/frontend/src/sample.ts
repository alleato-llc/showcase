import type { Project } from "./types";

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
