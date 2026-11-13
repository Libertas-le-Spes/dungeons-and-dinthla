import type { CachedMetadata, TFile } from "obsidian";
import { noteNameOf } from "../../src/campaign/paths/note-name";
import { TFile as StubFile } from "./obsidian";

export const CAMPAIGN = "D&D/Pale Moon";

export type Properties = Record<string, unknown>;

export function nameOf(path: string): string {
  return `${noteNameOf(path)}.md`;
}

export function fileAt(path: string, mtime = 0): TFile {
  const basename = noteNameOf(path);
  const file = Object.assign(new StubFile(), { path, name: `${basename}.md`, basename, extension: "md", stat: { mtime, ctime: 0, size: 0 } });
  return file as unknown as TFile;
}

export function cacheOf(properties: Properties): CachedMetadata {
  if (Object.keys(properties).length === 0) return {};
  return { frontmatter: { ...properties } };
}
