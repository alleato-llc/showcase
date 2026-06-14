# Showcase

A themeable static **portfolio/showcase engine**: an Astro site generator plus
a tool to edit project entries. Your actual portfolio lives in a separate
**instance** repo that supplies the data and config; this repo is the
template + skeleton + tool.

Modeled on the same engine/instance split as
[recommended-books](https://github.com/nycjv321/recommended-books): the engine
is a workspaces monorepo, the content is a thin sibling repo.

## Layout

```
packages/
  site/                 # Astro static-site generator (the skeleton)
schema/
  projects.schema.json  # the contract: an entry's shape (shared by site + tool)
  README.md             # data-model docs
examples/
  default/              # a sample instance — projects.json + config.json
tool/                   # Go module: CLI + Wails GUI editor   (coming next)
```

A live portfolio is an **instance** — its own repo holding just:

```
projects.json   # your entries  (validated against schema/projects.schema.json)
config.json     # name, nav, hero copy, footer, etc.
```

## How the site finds its data

`packages/site` reads `projects.json` + `config.json` from the directory in the
`SHOWCASE_DATA` env var, falling back to `examples/default` so the engine runs
out of the box.

```bash
npm install                                   # workspaces install
npm run dev                                    # engine + example data
npm run build                                  # → packages/site/dist
SHOWCASE_DATA=../javier-showcase npm run build # build an instance's data
```

## Editing entries

A **Go tool** in `tool/` — one shared core (`internal/model` + `internal/store`)
exposed as both a CLI and a Wails desktop GUI — edits an instance's
`projects.json`, validating against `schema/projects.schema.json`. (You can also
still hand-edit the JSON; see **[`schema/README.md`](schema/README.md)** for the
field reference.)

**CLI:**

```bash
cd tool && go build -o bin/showcase ./cmd/showcase   # build once
./tool/bin/showcase list                              # from the repo root
./tool/bin/showcase add --title … --emoji 🧪 --headline "…" --repo …
./tool/bin/showcase edit 3        # also: rm, move, validate, fmt
# every command takes --data DIR (default $SHOWCASE_DATA, else examples/default)
```

**GUI** (drag-reorder, emoji picker, live preview):

```bash
cd tool/gui && wails dev      # run the editor
cd tool/gui && wails build    # build a desktop app → tool/gui/build/bin
```

## Theming

Themes and fonts are **instance data** in `themes.json` (a list of color themes
and selectable display fonts; schema in `schema/themes.schema.json`). The header
**gear** lets visitors switch theme + font (saved per-browser); the instance
sets the defaults. Add/edit/delete themes in the admin GUI, or hand-edit
`themes.json`.

Each theme is a palette (`bg`, `surface`, `text`, `muted`, `faint`, `accent`,
`error`, `border`, `shadow`) the site emits as `:root[data-theme="<id>"]` CSS
variables; the chosen display font (system, serif, mono, the bundled Caveat, or
your own) drives `--font-display`. The engine ships Solarized Light + Dracula as
defaults. The projects table is also a resizable "sheet" (drag the border,
40%–85%; double-click to reset to 85%).

## Deployment

`npm run build` emits a static `packages/site/dist`. The flat-file build format
(`build: { format: "file" }`) makes extensionless URLs resolve on hosts that
append `.html`. Point `SHOWCASE_DATA` at an instance to build that portfolio.

This repo's own sites publish via GitHub Actions (OIDC → S3 → CloudFront
invalidate; see **[`INFRA.md`](INFRA.md)** for the AWS prerequisites and the two
repo variables `AWS_REGION` / `AWS_SITE_ROLE_ARN`):

- **`.github/workflows/ci.yml`** — on branches/PRs: Go build/vet/test + Astro
  build + GUI frontend build.
- **`.github/workflows/deploy.yml`** — on `main`: the **landing page**
  (`landing/`) → `showcase.alleato.dev`, and the **live demo** (the example
  instance) → `demo.showcase.alleato.dev`.

### Instances

A portfolio is an **instance** — built from this engine, deployed to its own
bucket/domain. Two shapes:

- **Standalone** (`scripts/new-instance.sh <dir> [--data <dir>] [--domain <host>]`)
  — scaffolds a self-contained copy of the site + a `data/` folder + a plain
  deploy workflow. Builds/deploys on its own (`npm ci && npm run build`); pull
  engine updates by re-running the script. Good for a single portfolio you own.
- **Thin** — a content-only repo whose CI checks this engine out as a sibling
  and builds with `SHOWCASE_DATA` pointed at it (the `dist` is generated at
  deploy time; engine updates auto-flow).

Either way, edit the data with this repo's CLI/GUI (`--data <instance>/data`) or
by hand.
