import { useEffect, useState } from "preact/hooks";

interface ThemeOpt {
  id: string;
  name: string;
}
interface FontOpt {
  id: string;
  name: string;
  stack: string;
}

/** The header gear: pick a theme and a display font. The chosen theme is set as
 *  `data-theme` on <html> (palettes are injected per theme by Layout); the font
 *  sets the `--font-display` custom property. Both persist to localStorage and
 *  are applied flash-free before paint by the inline script in Layout. */
export default function Settings({
  themes,
  fonts,
}: {
  themes: ThemeOpt[];
  fonts: FontOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("");
  const [font, setFont] = useState("");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "");
    setFont(localStorage.getItem("showcase-font") ?? "");
  }, []);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".settings")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pickTheme = (id: string) => {
    document.documentElement.dataset.theme = id;
    localStorage.setItem("showcase-theme", id);
    setTheme(id);
  };
  const pickFont = (f: FontOpt) => {
    document.documentElement.style.setProperty("--font-display", f.stack);
    localStorage.setItem("showcase-font", f.id);
    setFont(f.id);
  };

  return (
    <div class="settings">
      <button
        class="gear"
        aria-label="Theme and font settings"
        aria-expanded={open}
        title="Theme & font"
        onClick={() => setOpen((v) => !v)}
      >
        ⚙
      </button>
      {open && (
        <div class="settings-menu" role="menu">
          {themes.length > 1 && (
            <div class="settings-section">
              <div class="settings-label">Theme</div>
              {themes.map((t) => (
                <button
                  class={"settings-opt" + (t.id === theme ? " active" : "")}
                  onClick={() => pickTheme(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          {fonts.length > 1 && (
            <div class="settings-section">
              <div class="settings-label">Font</div>
              {fonts.map((f) => (
                <button
                  class={"settings-opt" + (f.id === font ? " active" : "")}
                  style={{ fontFamily: f.stack }}
                  onClick={() => pickFont(f)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
