import fs from "node:fs";
import path from "node:path";

/** A single link with its own label. The general form for projects with more
 *  than one live destination. `kind` only sets styling. */
export interface LinkSpec {
  label: string;
  url: string;
  kind?: "live" | "source";
}

/** One implementation of a project — same tool in another language, or an app
 *  plus its library. Renders as a segmented pill. */
export interface Implementation {
  label: string;
  site?: string;
  repo?: string;
}

export interface Project {
  title: string;
  emoji: string;
  headline: string;
  site?: string;
  repo?: string;
  links?: LinkSpec[];
  implementations?: Implementation[];
}

export interface NavLink {
  label: string;
  href: string;
}

/** Per-instance branding/config (an instance's config.json). */
export interface SiteConfig {
  /** Wordmark in the header. */
  name: string;
  /** <title> / og:title. */
  title: string;
  /** Meta description / og:description. */
  description: string;
  /** Hero heading (defaults to "Projects"). */
  heading?: string;
  /** Hero tagline line. */
  tagline?: string;
  /** Hero sub-paragraph. */
  intro?: string;
  /** Header nav links. */
  nav?: NavLink[];
  /** Footer left/right blurbs. */
  footer?: { left?: string; right?: string };
  /** Name shown in the © line (defaults to `name`). */
  copyright?: string;
}

// The site is data-driven: an instance points SHOWCASE_DATA at its own folder
// holding projects.json + config.json. Falling back to the bundled example
// keeps `npm run dev`/`build` in the engine working out of the box.
const dataDir = process.env.SHOWCASE_DATA
  ? path.resolve(process.env.SHOWCASE_DATA)
  : path.resolve(process.cwd(), "../../examples/default");

const read = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8")) as T;

const readOptional = <T>(file: string): T | null => {
  try {
    return read<T>(file);
  } catch {
    return null;
  }
};

export const projects: Project[] = read<Project[]>("projects.json");
export const config: SiteConfig = read<SiteConfig>("config.json");

// ---------- themes & fonts (themes.json) ----------

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  error: string;
  border: string;
  shadow: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: "light" | "dark";
  colors: ThemeColors;
}

/** A selectable display font. Web fonts carry a `family` + `url` so the site
 *  can emit an @font-face; system stacks need only `stack`. */
export interface Font {
  id: string;
  name: string;
  stack: string;
  family?: string;
  url?: string;
  weight?: string;
}

export interface ThemeSettings {
  default: string;
  defaultFont: string;
  themes: Theme[];
  fonts: Font[];
}

// Built-in fallback so instances without a themes.json still render. New
// instances get their own themes.json (see examples/default) that the admin
// edits.
const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  default: "solarized-light",
  defaultFont: "system",
  themes: [
    {
      id: "solarized-light",
      name: "Solarized Light",
      mode: "light",
      colors: {
        bg: "#fdf6e3", surface: "#eee8d5", text: "#073642", muted: "#657b83",
        faint: "#93a1a1", accent: "#268bd2", error: "#dc322f",
        border: "rgba(7,54,66,0.12)", shadow: "rgba(7,54,66,0.06)",
      },
    },
    {
      id: "dracula",
      name: "Dracula",
      mode: "dark",
      colors: {
        bg: "#1e1e2e", surface: "#343746", text: "#f8f8f2", muted: "#bd93f9",
        faint: "#6272a4", accent: "#ff79c6", error: "#ff5555",
        border: "rgba(248,248,242,0.1)", shadow: "rgba(0,0,0,0.3)",
      },
    },
  ],
  fonts: [
    { id: "system", name: "System", stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
    { id: "serif", name: "Serif", stack: "Georgia, 'Times New Roman', serif" },
    { id: "mono", name: "Mono", stack: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" },
    { id: "caveat", name: "Caveat (handwritten)", stack: "'Caveat', cursive", family: "Caveat", url: "/fonts/caveat.woff2", weight: "400 700" },
  ],
};

export const themeSettings: ThemeSettings =
  readOptional<ThemeSettings>("themes.json") ?? DEFAULT_THEME_SETTINGS;
