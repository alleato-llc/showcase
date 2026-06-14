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

Two palettes via a `data-theme` attribute (resolved before first paint; stored
choice wins, else system):

- **Light — Solarized Light**, styled as a composition notebook (paper grain,
  ruled table + red margin rule, Caveat handwriting on header/hero/footer).
  Notebook treatments are light-theme only.
- **Dark — Dracula** on a darkened `#1e1e2e` base; project names take the
  accent pink.

All colors are CSS custom properties at the top of
`packages/site/src/styles/global.css`. The projects table is a resizable
"sheet" (drag the border, 40%–85%; double-click to reset to 85%).

## Deployment

`npm run build` emits a static `packages/site/dist`. The flat-file build format
(`build: { format: "file" }`) makes extensionless URLs resolve on hosts that
append `.html`. Point `SHOWCASE_DATA` at an instance to build that portfolio.
