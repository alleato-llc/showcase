import { useEffect, useMemo, useState } from "preact/hooks";
import type { Implementation, LinkSpec, Project } from "./types";
import {
  chooseDataDir,
  dataDir,
  isWails,
  listProjects,
  saveProjects,
  validateProjects,
} from "./api";
import { emojiGroups } from "./emoji";
import { Preview } from "./preview";

const blank = (): Project => ({ title: "", emoji: "❓", headline: "" });

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sel, setSel] = useState(-1);
  const [dir, setDir] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [drag, setDrag] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setDir(await dataDir());
      const p = await listProjects();
      setProjects(p);
      setSel(p.length ? 0 : -1);
    })();
  }, []);

  const current = sel >= 0 ? projects[sel] : undefined;

  const mutate = (next: Project[]) => {
    setProjects(next);
    setStatus("Unsaved changes");
    setErrors([]);
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

  const save = async () => {
    const errs = await validateProjects(projects);
    setErrors(errs);
    if (errs.length) {
      setStatus("Fix validation errors before saving");
      return;
    }
    await saveProjects(projects);
    setStatus("Saved ✓");
  };
  const validate = async () => {
    const errs = await validateProjects(projects);
    setErrors(errs);
    setStatus(errs.length ? `${errs.length} problem(s)` : "Valid ✓");
  };
  const pickDir = async () => {
    const d = await chooseDataDir();
    setDir(d);
    const p = await listProjects();
    setProjects(p);
    setSel(p.length ? 0 : -1);
    setStatus("");
    setErrors([]);
  };

  return (
    <div class="editor">
      <header class="bar">
        <strong>Showcase Editor</strong>
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

      <section class="preview-pane">
        <div class="preview-head">
          <span>Live preview</span>
          <div class="seg-toggle">
            <button class={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>
              Light
            </button>
            <button class={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>
              Dark
            </button>
          </div>
        </div>
        <Preview projects={projects} theme={theme} />
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
