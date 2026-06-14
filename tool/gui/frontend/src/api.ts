import type { Project, ThemeSettings } from "./types";
import { sample, sampleThemes } from "./sample";

// The Wails runtime injects bound Go methods at window.go.main.App. When that's
// absent (running the frontend standalone in a plain browser, e.g. for dev or
// screenshots) we fall back to in-memory sample data so the UI still works.
const App = (globalThis as any).go?.main?.App as
  | {
      DataDir(): Promise<string>;
      ChooseDataDir(): Promise<string>;
      List(): Promise<Project[]>;
      Save(p: Project[]): Promise<void>;
      Validate(p: Project[]): Promise<string[]>;
      LoadThemes(): Promise<ThemeSettings>;
      SaveThemes(s: ThemeSettings): Promise<void>;
      ValidateThemes(s: ThemeSettings): Promise<string[]>;
    }
  | undefined;

export const isWails = !!App;

let standaloneData: Project[] = structuredClone(sample);
let standaloneThemes: ThemeSettings = structuredClone(sampleThemes);

export async function dataDir(): Promise<string> {
  return App ? App.DataDir() : "examples/default (standalone sample)";
}

export async function chooseDataDir(): Promise<string> {
  return App ? App.ChooseDataDir() : dataDir();
}

export async function listProjects(): Promise<Project[]> {
  return App ? App.List() : structuredClone(standaloneData);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  if (App) return App.Save(projects);
  standaloneData = structuredClone(projects);
}

export async function validateProjects(projects: Project[]): Promise<string[]> {
  if (App) return App.Validate(projects);
  // mirror the Go validation's required-field checks for standalone use
  const errs: string[] = [];
  projects.forEach((p, i) => {
    const tag = `project[${i + 1}] "${p.title}"`;
    if (!p.title?.trim()) errs.push(`project[${i + 1}]: title is required`);
    if (!p.emoji?.trim()) errs.push(`${tag}: emoji is required`);
    if (!p.headline?.trim()) errs.push(`${tag}: headline is required`);
  });
  return errs;
}

export async function loadThemes(): Promise<ThemeSettings> {
  return App ? App.LoadThemes() : structuredClone(standaloneThemes);
}

export async function saveThemes(s: ThemeSettings): Promise<void> {
  if (App) return App.SaveThemes(s);
  standaloneThemes = structuredClone(s);
}

export async function validateThemes(s: ThemeSettings): Promise<string[]> {
  if (App) return App.ValidateThemes(s);
  const errs: string[] = [];
  if (!s.themes.length) errs.push("themes: at least one theme is required");
  s.themes.forEach((t, i) => {
    if (!t.id?.trim()) errs.push(`themes[${i}]: id is required`);
    if (!t.name?.trim()) errs.push(`themes[${i}]: name is required`);
  });
  return errs;
}
