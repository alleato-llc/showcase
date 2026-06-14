# CLAUDE.md

Guidance for working in this repo. It's a **portfolio/showcase engine**: an
npm-workspaces monorepo with an Astro static-site generator (`packages/site`)
plus a forthcoming Go tool (`tool/`) to edit entries. Actual portfolios are
**separate instance repos** that supply `projects.json` + `config.json`; this
repo is the template/skeleton/tool. See `README.md` for the overview and
`schema/README.md` for the data model.

Architecture mirrors `../recommended-books` (engine monorepo + data instance).

## Commands (run from the repo root)

```bash
npm install      # workspaces install
npm run dev      # @showcase/site dev server, example data (:4321, next free port)
npm run build    # static build → packages/site/dist  (also the typecheck-ish gate)
npm run preview  # serve the build
# build against an instance's data:
SHOWCASE_DATA=../javier-showcase npm run build
```

No tests. Verify by building and, when visual, by screenshot (see "Visual
verification").

## Layout

```
packages/site/     # Astro site (the skeleton/generator)
  src/lib/content.ts   # loads projects.json + config.json from $SHOWCASE_DATA
  src/pages/index.astro   # table + resize script; link-render helpers in frontmatter
  src/layouts/Layout.astro  # head, header, footer — driven by config
  src/styles/global.css     # palettes + all styling
  src/components/ThemeToggle.tsx  # the one hydrated island (client:load)
  public/fonts/caveat.woff2 # self-hosted handwriting font (preloaded)
schema/
  projects.schema.json # the contract for an entry; keep site types + Go model in sync with it
  README.md            # data-model docs
examples/default/      # sample instance: projects.json + config.json
tool/                  # Go module: shared core + cobra CLI + Wails GUI (in progress)
```

## Data flow (engine ↔ instance)

- The site is **data-driven**: `src/lib/content.ts` reads `projects.json` and
  `config.json` from `process.env.SHOWCASE_DATA` (default `examples/default`,
  resolved from the site package's cwd). Templates import `projects` and
  `config` from there — do **not** hardcode branding/data in `.astro` files.
- `config.json` holds branding: `name`, `title`, `description`, `heading`,
  `tagline`, `intro`, `nav[]`, `footer{left,right}`, `copyright`.
- `projects.json` is the project list. Its shape is defined by
  `schema/projects.schema.json` — that schema is the single source of truth;
  the TS interfaces in `content.ts` and the Go model must match it.

## Data / link model

A project is `{ title, emoji, headline, site?, repo?, links?, implementations? }`.
Rendering rules are in `schema/README.md`. In short: `site`→ **Live** pill,
`repo`→ **Source** pill; `links[]` → arbitrary labeled pills; `implementations[]`
→ segmented pills (variant name → live, attached `</>` → source).

## Theming

Palettes on `:root[data-theme="light"|"dark"]` at the top of `global.css`:

- **Light = Solarized Light**, styled as a composition notebook.
- **Dark = Dracula** on a darkened `#1e1e2e` base; project names use `var(--accent)`.

Notebook-only treatments are scoped to `:root[data-theme="light"] …` and must
stay light-only (paper grain on `body` + `header.site` — same inline-SVG URI in
both; ruled table via `--rule`/`--margin-line`; Caveat via `--font-hand` on
header/hero/footer only).

## Resizable sheet

`.sheet` wraps the table; the inline script in `index.astro` makes it resizable
by dragging within `EDGE` px of the border (40%–85% of the viewport), with
double-click-border to reset to 85%. Disabled below 720px. An earlier
"crumple into a paper ball" effect was **intentionally removed** — don't
reintroduce it.

## Conventions & gotchas

- **Flat-file build** (`build: { format: "file" }`) so URLs resolve on hosts
  that append `.html`. Don't switch to directory format.
- **`@property` inheritance**: a registered custom property a `::before` must
  read needs `inherits: true` (past bug).
- Self-hosted fonts only, under `packages/site/public/fonts/`, preloaded.
- Light-only effects stay behind `:root[data-theme="light"]`; dark is flat.
- Keep `schema/projects.schema.json`, `content.ts` types, and the Go model in
  agreement — it's the cross-language contract.

## Visual verification

Headless Chrome is available. Build, then serve `packages/site/dist` over HTTP
(not `file://` — it breaks absolute `/_astro/…` paths) and screenshot:

```bash
(cd packages/site/dist && python3 -m http.server 8799 &)
# force dark by injecting before </body>:
#   <script>document.documentElement.dataset.theme='dark'</script>
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --force-color-profile=srgb \
  --window-size=1180,820 --hide-scrollbars --virtual-time-budget=2500 \
  --screenshot=/tmp/shot.png "http://localhost:8799/index.html"
```
