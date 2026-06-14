# Showcase

A small static site that lists my personal projects in a single, themeable
table — each row an emoji, title, one-line description, and links (live site
and/or source). Built with [Astro](https://astro.build) + Preact.

The look is borrowed from (and pairs with) the [Soroban](https://soroban.alleato.dev)
site: a **Solarized Light** "composition-notebook" light theme and a
**Catppuccin Mocha** dark theme, switchable and system-aware.

## Stack

- **Astro 5** — static output, flat-file build (`about.html`, not `about/index.html`)
- **Preact** — one interactive island, the theme toggle
- **TypeScript**
- No CSS framework; one hand-written `global.css`

## Getting started

```bash
npm install
npm run dev      # local dev server (default http://localhost:4321)
npm run build    # static build → dist/
npm run preview  # serve the built dist/ locally
```

## Adding or editing projects

Everything on the page comes from **`src/data/projects.json`** — edit that one
file to add, remove, or reorder projects. The page renders the array in order.

A minimal entry:

```json
{
  "title": "Soroban",
  "emoji": "🧮",
  "headline": "An exact calculator with a spreadsheet attached.",
  "site": "https://soroban.alleato.dev",
  "repo": "https://github.com/alleato-llc/soroban"
}
```

The links column adapts to whatever a project has:

- `site` / `repo` → a **Live** pill and/or a **Source** pill (a row with
  neither shows a dash).
- `links: [{ label, url, kind }]` → arbitrary labeled links, for projects with
  several live destinations (e.g. a demo *and* docs). `kind: "live"` is
  accented, `"source"` (default) is quiet.
- `implementations: [{ label, site?, repo? }]` → for a project shipped in
  several forms (e.g. the same tool in two languages). Each renders a
  **segmented pill**: the variant name links to its live site, an attached
  `</>` segment links to its source.

Full field reference and more examples: **[`src/data/README.md`](src/data/README.md)**.

## Theming

Two palettes, driven by a `data-theme` attribute on `<html>` resolved before
first paint (stored choice wins, else the system preference):

- **Light — Solarized Light**, dressed as a composition notebook: warm paper
  background with a faint procedural paper grain, the table ruled with blue
  lines and a red margin rule, and Caveat handwriting on the header, hero, and
  footer. The notebook treatments are **light-theme only**.
- **Dark — Catppuccin Mocha**: cozy `#1e1e2e` base with a soft pink accent.

All colors are CSS custom properties at the top of `src/styles/global.css`;
swapping a palette is editing one `:root[data-theme="…"]` block.

The projects table is a resizable "sheet": drag anywhere on its border to
resize it (40%–85% of the page), or double-click the border to reset to 85%.

## Project structure

```
src/
  pages/index.astro       # the page + the resize script
  layouts/Layout.astro    # <head>, header, footer, theme bootstrap
  components/ThemeToggle.tsx
  styles/global.css       # palettes + all styling
  data/projects.json      # ← the project list (source of truth)
  data/README.md          # data-model docs
public/
  fonts/caveat.woff2      # self-hosted handwriting font
  favicon.svg
```

## Deployment

`npm run build` emits a fully static `dist/`. The flat-file build format
(`build: { format: "file" }` in `astro.config.mjs`) is chosen so extensionless
URLs resolve on hosts that append `.html`. Deploy `dist/` to any static host.
