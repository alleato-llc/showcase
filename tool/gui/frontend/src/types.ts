// Mirrors tool/internal/model (and schema/projects.schema.json).
export interface LinkSpec {
  label: string;
  url: string;
  kind?: "live" | "source";
}

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

// ---- themes.json ----
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

export const COLOR_KEYS: (keyof ThemeColors)[] = [
  "bg",
  "surface",
  "text",
  "muted",
  "faint",
  "accent",
  "error",
  "border",
  "shadow",
];
