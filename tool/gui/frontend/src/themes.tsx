import type { Font, Theme, ThemeColors, ThemeSettings } from "./types";
import { COLOR_KEYS } from "./types";

const blankTheme = (n: number): Theme => ({
  id: `theme-${n}`,
  name: `Theme ${n}`,
  mode: "dark",
  colors: {
    bg: "#1e1e2e", surface: "#2a2a3a", text: "#f0f0f0", muted: "#a0a0c0",
    faint: "#707090", accent: "#ff79c6", error: "#ff5555",
    border: "rgba(255,255,255,0.1)", shadow: "rgba(0,0,0,0.3)",
  },
});
const blankFont = (n: number): Font => ({
  id: `font-${n}`,
  name: `Font ${n}`,
  stack: "system-ui, sans-serif",
});

// type="color" needs #rrggbb; pull that out of a value, else fall back. (rgba
// border/shadow values just show #000000 in the swatch and are edited as text.)
const toHex = (v: string): string => {
  const m = v.trim().match(/^#([0-9a-fA-F]{6})/);
  return m ? "#" + m[1] : "#000000";
};

export function ThemesPanel({
  settings,
  onChange,
  sel,
  setSel,
}: {
  settings: ThemeSettings;
  onChange: (s: ThemeSettings) => void;
  sel: number;
  setSel: (i: number) => void;
}) {
  const theme: Theme | undefined = settings.themes[sel];
  const patch = (s: Partial<ThemeSettings>) => onChange({ ...settings, ...s });

  const updateTheme = (p: Partial<Theme>) => {
    const next = settings.themes.slice();
    next[sel] = { ...next[sel], ...p };
    patch({ themes: next });
  };
  const updateColor = (k: keyof ThemeColors, v: string) =>
    updateTheme({ colors: { ...theme!.colors, [k]: v } });
  const addTheme = () => {
    const next = [...settings.themes, blankTheme(settings.themes.length + 1)];
    patch({ themes: next });
    setSel(next.length - 1);
  };
  const delTheme = (i: number) => {
    const next = settings.themes.filter((_, j) => j !== i);
    patch({ themes: next });
    setSel(Math.max(0, Math.min(i, next.length - 1)));
  };

  const setFont = (i: number, f: Font) => {
    const next = settings.fonts.slice();
    next[i] = f;
    patch({ fonts: next });
  };

  return (
    <div class="cols">
      <aside class="list">
        <div class="list-head">
          <span>{settings.themes.length} themes</span>
          <button onClick={addTheme}>+ Add</button>
        </div>
        <ul>
          {settings.themes.map((t, i) => (
            <li class={"row" + (i === sel ? " active" : "")} onClick={() => setSel(i)}>
              <span class="swatch" style={{ background: t.colors.accent }} />
              <span class="row-title">{t.name || <em>untitled</em>}</span>
              <span class="mode-badge">{t.mode}</span>
              <button
                class="del"
                onClick={(e) => {
                  e.stopPropagation();
                  delTheme(i);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div class="list-head">
          <span>Default theme</span>
        </div>
        <div class="default-pick">
          <select
            value={settings.default}
            onChange={(e) => patch({ default: (e.target as HTMLSelectElement).value })}
          >
            {settings.themes.map((t) => (
              <option value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </aside>

      <section class="form">
        {theme ? (
          <div class="fields">
            <div class="field">
              <label>Name</label>
              <input
                value={theme.name}
                onInput={(e) => updateTheme({ name: (e.target as HTMLInputElement).value })}
              />
            </div>
            <div class="field">
              <label>ID (used as data-theme)</label>
              <input
                value={theme.id}
                onInput={(e) => updateTheme({ id: (e.target as HTMLInputElement).value })}
              />
            </div>
            <div class="field">
              <label>Mode</label>
              <select
                value={theme.mode}
                onChange={(e) =>
                  updateTheme({ mode: (e.target as HTMLSelectElement).value as "light" | "dark" })
                }
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </div>
            <div class="field">
              <label>Colors</label>
              <div class="color-grid">
                {COLOR_KEYS.map((k) => (
                  <div class="color-row">
                    <span class="color-key">{k}</span>
                    <input
                      class="swatch-input"
                      type="color"
                      value={toHex(theme.colors[k])}
                      onInput={(e) => updateColor(k, (e.target as HTMLInputElement).value)}
                    />
                    <input
                      class="hex"
                      value={theme.colors[k]}
                      onInput={(e) => updateColor(k, (e.target as HTMLInputElement).value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p class="empty">No themes. Click “+ Add”.</p>
        )}

        <div class="fields">
          <div class="field array">
            <label>Fonts (custom web fonts: set a URL; the stack must name the family)</label>
            {settings.fonts.map((f, i) => (
              <div class="array-row font-row">
                <input
                  class="sm"
                  placeholder="name"
                  value={f.name}
                  onInput={(e) => setFont(i, { ...f, name: (e.target as HTMLInputElement).value })}
                />
                <input
                  placeholder="CSS font stack"
                  value={f.stack}
                  onInput={(e) => setFont(i, { ...f, stack: (e.target as HTMLInputElement).value })}
                />
                <input
                  class="sm"
                  placeholder="web-font URL (optional)"
                  value={f.url ?? ""}
                  onInput={(e) =>
                    setFont(i, { ...f, url: (e.target as HTMLInputElement).value || undefined })
                  }
                />
                <button
                  class="del"
                  onClick={() => patch({ fonts: settings.fonts.filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              class="add"
              onClick={() => patch({ fonts: [...settings.fonts, blankFont(settings.fonts.length + 1)] })}
            >
              + font
            </button>
          </div>
          <div class="field">
            <label>Default font</label>
            <select
              value={settings.defaultFont}
              onChange={(e) => patch({ defaultFont: (e.target as HTMLSelectElement).value })}
            >
              {settings.fonts.map((f) => (
                <option value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
