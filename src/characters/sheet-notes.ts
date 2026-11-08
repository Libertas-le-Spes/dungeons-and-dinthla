import type { App, TFile } from "obsidian";
import type { CarriedGroup } from "./character-sheet";
import { characterNotesOf, type CharacterNotes } from "./character-notes";

export interface CarriedFrom {
  path: string;
  groups: CarriedGroup[];
}

export interface SheetNotes extends CharacterNotes {
  fileAt(path: string): TFile | null;
  carriedFromOf(file: TFile): CarriedFrom | null;
}

const CARRIED_FROM = "carried from";
const CARRIED_GROUPS: CarriedGroup[] = ["abilities", "values"];

export function carriedGroupsOf(listed: unknown): CarriedGroup[] {
  let names: unknown[] = [];
  if (Array.isArray(listed)) names = listed;
  else if (typeof listed === "string") names = [listed];
  return CARRIED_GROUPS.filter((group) => names.some((name) => typeof name === "string" && name.trim().toLowerCase() === group));
}

function carriedFromOf(app: App, notes: CharacterNotes, file: TFile): CarriedFrom | null {
  const cache = app.metadataCache.getFileCache(file);
  if (cache === null) return null;
  const links = cache.frontmatterLinks;
  if (links === undefined) return null;
  const link = links.find((candidate) => candidate.key === CARRIED_FROM);
  if (link === undefined) return null;
  const path = notes.pathOfLink(link.link, file.path);
  if (path === null || path === file.path) return null;
  let listed: unknown = undefined;
  if (cache.frontmatter !== undefined) listed = cache.frontmatter.carried;
  return { path, groups: carriedGroupsOf(listed) };
}

export function sheetNotesOf(app: App): SheetNotes {
  const notes = characterNotesOf(app);
  return {
    ...notes,
    fileAt: (path) => app.vault.getFileByPath(path),
    carriedFromOf: (file) => carriedFromOf(app, notes, file),
  };
}
