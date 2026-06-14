# Projects data

`projects.json` is the single source of truth for the showcase table. Edit it
to add, remove, or reorder projects — the homepage renders it directly, in
array order.

Each entry:

| Field      | Required | Meaning                                                          |
| ---------- | -------- | ---------------------------------------------------------------- |
| `title`    | yes      | App name. Used as the row's linked label.                        |
| `emoji`    | yes      | A single emoji shown in the first column.                        |
| `headline` | yes      | One-line description.                                            |
| `site`     | no       | Live site / "in action" URL. Renders a **Live** pill.            |
| `repo`     | no       | Source repository URL. Renders a **Source** pill.                |

**Links column:** each project shows one pill per link it has. A project with
both `site` and `repo` shows **Live** + **Source**; with only one, just that
pill; with neither, a dash. So projects that don't have a landing page simply
omit `site` and only the Source pill appears — no empty gaps.

## Projects with several implementations

When one project ships in multiple forms — the same tool in different
languages, or an app plus the library behind it — give it an `implementations`
array instead of (or in addition to) a top-level `repo`. Each implementation is
`{ "label", "site"?, "repo"? }`. A top-level `site` still renders a shared
**Live** pill for a landing page common to every implementation.

Each implementation renders as a **segmented pill**:

- with both `site` and `repo` → a two-segment pill: the **variant name → its
  `site`** (accent, with a ↗) joined to a quiet **`</>` segment → its `repo`**.
- with only `repo` → a single segment: the **variant name → the repo**.
- with only `site` → a single segment: the **variant name → the site**.

So a project with two source-only variants reads as `( Rust )( Swift )`:

```json
{
  "title": "dr",
  "emoji": "🎚️",
  "headline": "A dynamic range meter for audio files — in two languages.",
  "implementations": [
    { "label": "Rust",  "repo": "https://github.com/alleato-llc/dr" },
    { "label": "Swift", "repo": "https://github.com/alleato-llc/dr-kit" }
  ]
}
```

### When variants gain a live link (e.g. binary downloads)

Once an implementation has somewhere to *go* — a download/releases page, a
hosted demo, a landing page — add its `site`. Each variant then renders as the
full two-segment pill, and you get **two live + two source** in one cell:

```json
{
  "title": "dr",
  "emoji": "🎚️",
  "headline": "A dynamic range meter for audio files — in two languages.",
  "implementations": [
    {
      "label": "Rust",
      "site": "https://github.com/alleato-llc/dr/releases/latest",
      "repo": "https://github.com/alleato-llc/dr"
    },
    {
      "label": "Swift",
      "site": "https://github.com/alleato-llc/dr-kit/releases/latest",
      "repo": "https://github.com/alleato-llc/dr-kit"
    }
  ]
}
```

Renders as `( Rust ↗ |</> )( Swift ↗ |</> )` — the variant name links to its
binary/download (`site`), the `</>` to its source. The `site` can be any live
destination; a releases page is just the common one for compiled tools.

## Projects with several live links

`site` / `repo` cover one live destination and one source. When a project has
**more than one live destination** — a landing page *and* a hosted demo, web
*and* a store listing, docs, a playground — use the general `links` array
instead. Each entry is `{ "label", "url", "kind"? }`:

```json
{
  "title": "Example",
  "emoji": "✨",
  "headline": "…",
  "links": [
    { "label": "Demo",   "url": "https://demo.example.com",    "kind": "live" },
    { "label": "Docs",   "url": "https://docs.example.com",    "kind": "live" },
    { "label": "Source", "url": "https://github.com/…/example" }
  ]
}
```

- `kind` only controls styling — `"live"` is accented, `"source"` (the default)
  is quiet. You can have **any number** of `"live"` pills.
- Pills are distinguished by their **label**, not by the word "Live", so give
  each live link a descriptive label (`Demo`, `Docs`, `iOS`, `Web`…) rather
  than reusing "Live".

`site`, `repo`, `links`, and `implementations` all compose — a project can have
a shared landing page (`site`), extra labeled links (`links`), and per-variant
pills (`implementations`) at once.

Set `emoji` to `❓` and `headline` to `TODO: ...` for rows you haven't filled in
yet — they render in a muted "todo" style so unfinished entries are obvious.
