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

export const projects: Project[] = read<Project[]>("projects.json");
export const config: SiteConfig = read<SiteConfig>("config.json");
