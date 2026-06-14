# CLAUDE.md

Guidance for working in this repo. It's a small static **Astro 5 + Preact**
site: a single themeable table of personal projects. See `README.md` for the
human-facing overview and `src/data/README.md` for the data model.

## Commands

```bash
npm run dev      # dev server (default :4321; picks the next free port if taken)
npm run build    # static build → dist/  (also the typecheck-ish gate; run after changes)
npm run preview  # serve dist/
```

There are no tests. Verify changes by building and, when it's visual, by
rendering a screenshot (see "Visual verification").

## Architecture

- **`src/data/projects.json`** is the single source of truth for the table.
  Treat it as data, not code — most "add/change a project" requests are edits
  here only.
- **`src/pages/index.astro`** renders the table from that JSON and contains the
  inline resize script. The link-rendering helpers live in the frontmatter:
  - `topLinks(p)` → pills from `site` / `repo` / `links[]`
  - per-`implementation` segmented pills are built inline in the template
- **`src/layouts/Layout.astro`** holds `<head>`, the sticky header, the footer
  (with the build-time copyright year), and the pre-paint theme bootstrap
  script (reads `localStorage["showcase-theme"]`, else system preference).
- **`src/styles/global.css`** is all styling: the two palettes plus every rule.
- **`src/components/ThemeToggle.tsx`** is the only hydrated island (`client:load`).

## Data / link model

A project is `{ title, emoji, headline, site?, repo?, links?, implementations? }`.
Rendering rules (and the rationale) are documented in `src/data/README.md` —
read it before changing link rendering. In short:

- `site`→ **Live** pill, `repo`→ **Source** pill.
- `links: [{ label, url, kind? }]` → arbitrary labeled pills (`kind:"live"`
  accented, `"source"` quiet/default). Use when a project has multiple live
  destinations; give each a distinct label (pills are told apart by label).
- `implementations: [{ label, site?, repo? }]` → one **segmented pill** per
  variant (name → live, attached `</>` → source). For a project shipped in
  multiple forms/languages.

## Theming

Palettes are CSS custom properties on `:root[data-theme="light"|"dark"]` at the
top of `global.css`:

- **Light = Solarized Light**, styled as a composition notebook.
- **Dark = Catppuccin Mocha**.

Notebook-only treatments are scoped to `:root[data-theme="light"] …` and must
stay light-only:

- **Paper grain**: a procedural inline-SVG `feTurbulence` noise as a `data:`
  URI background on `body` and `header.site` (kept in sync — same URI in both).
- **Ruled table**: row dividers use `--rule` (blue); the emoji column's right
  edge is the red `--margin-line`.
- **Handwriting**: self-hosted **Caveat** (`public/fonts/caveat.woff2`,
  variable weight, preloaded) via `--font-hand`, applied to the header,
  hero, and footer only — body/table stay in the system font.

To change a theme, edit the relevant `:root[data-theme="…"]` block. To preview
alternative palettes, override the block in a built copy and screenshot it
(below) rather than guessing hex values.

## Resizable sheet

The table is wrapped in `.sheet`; the inline script in `index.astro` makes it
resizable:

- drag anywhere within `EDGE` px of the border → resize width, symmetric about
  the page center; clamped to **40%–85%** of the viewport.
- double-click the border → reset to 85%.
- disabled below 720px viewport (the sheet already fills small screens).

Note: an earlier elaborate "crumple into a paper ball on shrink" effect was
**intentionally removed** — don't reintroduce it unless asked.

## Conventions & gotchas

- **Flat-file build**: `astro.config.mjs` sets `build: { format: "file" }` so
  URLs resolve on hosts that append `.html`. Don't switch to directory format.
- **`@property` inheritance**: if you add a registered custom property that a
  `::before`/`::after` must read, it needs `inherits: true` (a pseudo-element
  inherits from its host) — a subtle past bug.
- **Self-hosted font, no CDN**: keep fonts local under `public/fonts/` and
  preloaded in `Layout.astro`.
- Light-only effects must stay behind `:root[data-theme="light"]`; dark mode is
  deliberately flat.

## Visual verification

This environment has headless Chrome. To check a change (especially dark mode
or a palette), build, then serve `dist/` over HTTP and screenshot — `file://`
breaks the absolute `/_astro/…` asset paths, so use a local server:

```bash
(cd dist && python3 -m http.server 8799 &)
# to force dark, inject before </body>:
#   <script>document.documentElement.dataset.theme='dark'</script>
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --force-color-profile=srgb \
  --window-size=1180,820 --hide-scrollbars --virtual-time-budget=2500 \
  --screenshot=/tmp/shot.png "http://localhost:8799/index.html"
```
