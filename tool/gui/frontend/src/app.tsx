import { useEffect, useState } from "preact/hooks";
import type { Implementation, LinkSpec, Project, ThemeColors, ThemeSettings } from "./types";
import {
  chooseDataDir,
  dataDir,
  isWails,
  listProjects,
  loadThemes,
  saveProjects,
  saveThemes,
  validateProjects,
  validateThemes,
} from "./api";
import { emojiGroups } from "./emoji";
import { Preview } from "./preview";
import { ThemesPanel } from "./themes";

const blank = (): Project => ({ title: "", emoji: "❓", headline: "" });

const FALLBACK: ThemeColors = {
  bg: "#1e1e2e", surface: "#2a2a3a", text: "#eee", muted: "#aaa", faint: "#777",
  accent: "#ff79c6", error: "#f55", border: "rgba(255,255,255,0.1)", shadow: "rgba(0,0,0,0.3)",
};

export function App() {
  const [view, setView] = useState<"projects" | "themes">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [sel, setSel] = useState(-1);
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  const [themeSel, setThemeSel] = useState(0);
  const [previewTheme, setPreviewTheme] = useState("");
  const [dir, setDir] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [drag, setDrag] = useState<number | null>(null);

  const load = async () => {
    setDir(await dataDir());
    const p = await listProjects();
    setProjects(p);
    setSel(p.length ? 0 : -1);
    const s = await loadThemes();
    setSettings(s);
    setPreviewTheme(s.default);
    setStatus("");
    setErrors([]);
  };
  useEffect(() => {
    load();
  }, []);

  const current = sel >= 0 ? projects[sel] : undefined;
  const dirty = () => {
    setStatus("Unsaved changes");
    setErrors([]);
  };

  // ---- projects mutations ----
  const mutate = (next: Project[]) => {
    setProjects(next);
    dirty();
  };
  const update = (patch: Partial<Project>) => {
    if (sel < 0) return;
    const next = projects.slice();
    next[sel] = { ...next[sel], ...patch };
    mutate(next);
  };
  const addProject = () => {
    const next = [...projects, blank()];
    mutate(next);
    setSel(next.length - 1);
  };
  const removeProject = (i: number) => {
    const next = projects.slice();
    next.splice(i, 1);
    mutate(next);
    setSel(next.length ? Math.min(i, next.length - 1) : -1);
  };
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = projects.slice();
    const [p] = next.splice(from, 1);
    next.splice(to, 0, p);
    mutate(next);
    setSel(to);
  };

  // ---- theme mutations ----
  const updateSettings = (s: ThemeSettings) => {
    setSettings(s);
    dirty();
  };

  // ---- save / validate (context-aware) ----
  const save = async () => {
    if (view === "themes" && settings) {
      const errs = await validateThemes(settings);
      setErrors(errs);
      if (errs.length) return setStatus("Fix theme errors before saving");
      await saveThemes(settings);
    } else {
      const errs = await validateProjects(projects);
      setErrors(errs);
      if (errs.length) return setStatus("Fix validation errors before saving");
      await saveProjects(projects);
    }
    setStatus("Saved ✓");
  };
  const validate = async () => {
    const errs =
      view === "themes" && settings
        ? await validateThemes(settings)
        : await validateProjects(projects);
    setErrors(errs);
    setStatus(errs.length ? `${errs.length} problem(s)` : "Valid ✓");
  };
  const pickDir = async () => {
    await chooseDataDir();
    await load();
  };

  const previewColors: ThemeColors = !settings
    ? FALLBACK
    : view === "themes"
      ? (settings.themes[themeSel]?.colors ?? FALLBACK)
      : (settings.themes.find((t) => t.id === previewTheme)?.colors ??
        settings.themes[0]?.colors ??
        FALLBACK);

  return (
    <div class="editor">
      <header class="bar">
        <strong>Showcase</strong>
        <div class="tabs">
          <button class={view === "projects" ? "on" : ""} onClick={() => setView("projects")}>
            Projects
          </button>
          <button class={view === "themes" ? "on" : ""} onClick={() => setView("themes")}>
            Themes
          </button>
        </div>
        <span class="dir" title={dir}>{dir}</span>
        <span class="spacer" />
        {isWails && (
          <button onClick={pickDir} title="Open a different instance folder">
            Open folder…
          </button>
        )}
        <button onClick={validate}>Validate</button>
        <button class="primary" onClick={save}>Save</button>
        <span class={"status" + (status.includes("✓") ? " ok" : status ? " warn" : "")}>
          {status}
        </span>
      </header>

      {errors.length > 0 && (
        <ul class="errors">
          {errors.map((e) => (
            <li>{e}</li>
          ))}
        </ul>
      )}

      {view === "projects" ? (
        <div class="cols">
          <aside class="list">
            <div class="list-head">
              <span>{projects.length} projects</span>
              <button onClick={addProject}>+ Add</button>
            </div>
            <ul>
              {projects.map((p, i) => (
                <li
                  class={"row" + (i === sel ? " active" : "") + (drag === i ? " dragging" : "")}
                  draggable
                  onClick={() => setSel(i)}
                  onDragStart={() => setDrag(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (drag !== null) reorder(drag, i);
                    setDrag(null);
                  }}
                  onDragEnd={() => setDrag(null)}
                >
                  <span class="grip">⠿</span>
                  <span class="row-emoji">{p.emoji}</span>
                  <span class="row-title">{p.title || <em>untitled</em>}</span>
                  <button
                    class="del"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProject(i);
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section class="form">
            {current ? (
              <Editor project={current} update={update} />
            ) : (
              <p class="empty">No project selected. Click “+ Add” to create one.</p>
            )}
          </section>
        </div>
      ) : settings ? (
        <ThemesPanel
          settings={settings}
          onChange={updateSettings}
          sel={themeSel}
          setSel={setThemeSel}
        />
      ) : (
        <p class="empty">Loading…</p>
      )}

      <section class="preview-pane">
        <div class="preview-head">
          <span>Live preview</span>
          {view === "projects" && settings && (
            <select
              class="preview-theme"
              value={previewTheme}
              onChange={(e) => setPreviewTheme((e.target as HTMLSelectElement).value)}
            >
              {settings.themes.map((t) => (
                <option value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
        <Preview projects={projects} colors={previewColors} />
      </section>
    </div>
  );
}

function Editor({
  project,
  update,
}: {
  project: Project;
  update: (patch: Partial<Project>) => void;
}) {
  const [picker, setPicker] = useState(false);
  return (
    <div class="fields">
      <div class="field emoji-field">
        <label>Emoji</label>
        <div class="emoji-row">
          <input
            value={project.emoji}
            onInput={(e) => update({ emoji: (e.target as HTMLInputElement).value })}
          />
          <button onClick={() => setPicker((v) => !v)}>Pick…</button>
        </div>
        {picker && (
          <div class="picker">
            {emojiGroups.map((g) => (
              <div class="picker-group">
                <div class="picker-label">{g.label}</div>
                <div class="picker-grid">
                  {g.emojis.map((em) => (
                    <button
                      class="picker-emoji"
                      onClick={() => {
                        update({ emoji: em });
                        setPicker(false);
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Text label="Title" value={project.title} onChange={(v) => update({ title: v })} />
      <Text
        label="Headline"
        value={project.headline}
        onChange={(v) => update({ headline: v })}
      />
      <Text
        label="Live site URL"
        value={project.site ?? ""}
        onChange={(v) => update({ site: v })}
        placeholder="https://…  (optional)"
      />
      <Text
        label="Source repo URL"
        value={project.repo ?? ""}
        onChange={(v) => update({ repo: v })}
        placeholder="https://github.com/…  (optional)"
      />

      <LinksEditor
        links={project.links ?? []}
        onChange={(links) => update({ links: links.length ? links : undefined })}
      />
      <ImplsEditor
        impls={project.implementations ?? []}
        onChange={(implementations) =>
          update({ implementations: implementations.length ? implementations : undefined })
        }
      />
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div class="field">
      <label>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    </div>
  );
}

function LinksEditor({
  links,
  onChange,
}: {
  links: LinkSpec[];
  onChange: (l: LinkSpec[]) => void;
}) {
  const set = (i: number, patch: Partial<LinkSpec>) => {
    const next = links.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  return (
    <div class="field array">
      <label>Extra links (several live destinations)</label>
      {links.map((l, i) => (
        <div class="array-row">
          <input
            class="sm"
            placeholder="label"
            value={l.label}
            onInput={(e) => set(i, { label: (e.target as HTMLInputElement).value })}
          />
          <input
            placeholder="https://…"
            value={l.url}
            onInput={(e) => set(i, { url: (e.target as HTMLInputElement).value })}
          />
          <select
            value={l.kind ?? "source"}
            onChange={(e) =>
              set(i, { kind: (e.target as HTMLSelectElement).value as "live" | "source" })
            }
          >
            <option value="live">live</option>
            <option value="source">source</option>
          </select>
          <button class="del" onClick={() => onChange(links.filter((_, j) => j !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button class="add" onClick={() => onChange([...links, { label: "", url: "" }])}>
        + link
      </button>
    </div>
  );
}

function ImplsEditor({
  impls,
  onChange,
}: {
  impls: Implementation[];
  onChange: (i: Implementation[]) => void;
}) {
  const set = (i: number, patch: Partial<Implementation>) => {
    const next = impls.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  return (
    <div class="field array">
      <label>Implementations (variants — e.g. languages)</label>
      {impls.map((im, i) => (
        <div class="array-row">
          <input
            class="sm"
            placeholder="label"
            value={im.label}
            onInput={(e) => set(i, { label: (e.target as HTMLInputElement).value })}
          />
          <input
            placeholder="live URL (optional)"
            value={im.site ?? ""}
            onInput={(e) => set(i, { site: (e.target as HTMLInputElement).value })}
          />
          <input
            placeholder="repo URL (optional)"
            value={im.repo ?? ""}
            onInput={(e) => set(i, { repo: (e.target as HTMLInputElement).value })}
          />
          <button class="del" onClick={() => onChange(impls.filter((_, j) => j !== i))}>
            ✕
          </button>
        </div>
      ))}
      <button class="add" onClick={() => onChange([...impls, { label: "" }])}>
        + implementation
      </button>
    </div>
  );
}
