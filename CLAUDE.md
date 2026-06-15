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
tool/                  # Go module (github.com/nycjv321/showcase/tool)
  internal/model       # Project types + Validate() — mirrors the schema
  internal/store       # atomic load/save of projects.json
  cmd/showcase         # stdlib CLI (list/add/edit/rm/move/validate/fmt)
  gui/                 # Wails desktop app — shares model+store
    app.go             # bound methods (List/Save/Validate/DataDir/ChooseDataDir)
    main.go            # wails.Run; //go:embed all:frontend/dist
    frontend/          # Preact + Vite + TS editor (list, forms, emoji picker, live preview)
```

## Tool build/run

- CLI: `cd tool && go build -o bin/showcase ./cmd/showcase`, run from the repo
  root so the default `examples/default` resolves (or pass `--data`).
- GUI: `cd tool/gui && wails dev` (run) or `wails build` (package). Both build
  the frontend first.
- Gotcha: `main.go` has `//go:embed all:frontend/dist`, so **building/vetting
  `./gui` requires `tool/gui/frontend/dist` to exist** — run
  `npm --prefix tool/gui/frontend run build` (or any `wails` command) first.
  `frontend/dist` is gitignored (a build artifact). Building `./cmd/...` and
  `./internal/...` (the CLI + core) needs no frontend.
- The frontend's `src/api.ts` calls Go via `window.go.main.App.*` when running
  under Wails, and falls back to bundled `sample.ts` when run standalone in a
  browser (handy for dev/screenshots).

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

## Theming (data-driven)

Themes and fonts are **instance data** in `themes.json` (schema:
`schema/themes.schema.json`), not hardcoded. Shape: `{ default, defaultFont,
themes[], fonts[] }`; each theme is `{ id, name, mode, colors{bg,surface,text,
muted,faint,accent,error,border,shadow} }`; each font is `{ id, name, stack,
family?, url?, weight? }` (web fonts carry `family`+`url`).

- `Layout.astro` emits one `:root[data-theme="<id>"]{…}` block per theme and an
  `@font-face` per web font, plus a flash-free init that applies the stored (or
  default) `data-theme` and `--font-display`.
- `global.css` holds **only structure** — no palette values, no decorations.
  The earlier notebook treatments (paper grain, ruled table/margin, forced
  handwriting) were **removed**; the display font is now switchable via
  `--font-display` (applied to wordmark/nav/hero/footer). Caveat is just one
  selectable font now.
- The header **gear** (`components/Settings.tsx`) picks theme + font, persisting
  to `localStorage` (`showcase-theme`, `showcase-font`).
- `content.ts` exposes `themeSettings` with a built-in fallback so instances
  without `themes.json` still render. Keep the TS `Theme`/`Font` types, the Go
  model, and `schema/themes.schema.json` in agreement.
- Project names use `var(--accent)` in every theme.

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
- Self-hosted fonts only, under `packages/site/public/fonts/`, preloaded; web
  fonts in `themes.json` use the font `name` as the `@font-face` family.
- Themes are data (`themes.json`) — no palette values or decorations in
  `global.css`. Keep the schemas (`projects` + `themes`), `content.ts` types,
  and the Go model in agreement — they're the cross-language contracts.

## Deploy / infra

- `.github/workflows/ci.yml` (branches/PRs) builds + vets; `deploy.yml` (main)
  builds and publishes via [`salpa`](https://github.com/alleato-llc/salpa)
  (`salpa deploy`). The engine publishes two sites: the `landing/` page and the
  example-instance demo.
- Hosting is provisioned **outside this repo**; the deploy workflow reads its
  target from repo variables. Keep host-specific details out of the docs here.
- Instances come in two shapes: **standalone** (scaffolded by
  `scripts/new-instance.sh` — a self-contained site copy + `data/`, builds on
  its own; `nycjv321/showcase` is this) or **thin** (content-only, CI checks the
  engine out as a sibling and builds with `SHOWCASE_DATA`). The standalone reads
  `./data` via `SHOWCASE_DATA=./data` in its npm scripts.

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
