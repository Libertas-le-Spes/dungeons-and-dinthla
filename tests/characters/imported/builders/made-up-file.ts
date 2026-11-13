import type { TFile } from "obsidian";

export function madeUpFile(path: string): TFile {
  const name = path.substring(path.lastIndexOf("/") + 1);
  return { path, basename: name.substring(0, name.length - ".md".length) } as TFile;
}
