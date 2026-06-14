import type { Project, ThemeColors } from "./types";

interface Pill {
  label: string;
  url: string;
  kind: "live" | "source";
}

// Same precedence the site uses: site/repo shorthand, then explicit links.
function topLinks(p: Project): Pill[] {
  const pills: Pill[] = [];
  const push = (label: string, url: string | undefined, kind: Pill["kind"]) => {
    const u = url?.trim();
    if (u) pills.push({ label, url: u, kind });
  };
  push("Live", p.site, "live");
  push("Source", p.repo, "source");
  for (const l of p.links ?? []) push(l.label, l.url, l.kind ?? "source");
  return pills;
}

export function Preview({
  projects,
  colors,
}: {
  projects: Project[];
  colors: ThemeColors;
}) {
  // apply the theme's palette as inline CSS variables so the preview reflects
  // whatever theme is selected/being edited, live
  const style = {
    "--bg": colors.bg,
    "--surface": colors.surface,
    "--text": colors.text,
    "--muted": colors.muted,
    "--faint": colors.faint,
    "--accent": colors.accent,
    "--border": colors.border,
    "--name": colors.accent,
  } as Record<string, string>;
  return (
    <div class="preview" style={style}>
      <table class="pv-table">
        <thead>
          <tr>
            <th aria-label="emoji"></th>
            <th>Project</th>
            <th>What it is</th>
            <th>Links</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr>
              <td class="pv-emoji">{p.emoji}</td>
              <td class="pv-name">{p.title}</td>
              <td class="pv-headline">{p.headline}</td>
              <td class="pv-links">
                {topLinks(p).map((l) => (
                  <span class={`pv-pill ${l.kind}`}>{l.label}</span>
                ))}
                {(p.implementations ?? []).map((im) => {
                  const live = im.site?.trim();
                  const repo = im.repo?.trim();
                  return (
                    <span class="pv-seg">
                      {live && <span class="pv-seg-part live">{im.label} ↗</span>}
                      {repo && (
                        <span class="pv-seg-part source">{live ? "</>" : im.label}</span>
                      )}
                    </span>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
