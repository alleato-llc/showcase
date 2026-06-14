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
