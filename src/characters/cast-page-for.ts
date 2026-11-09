import type { Component, TFile } from "obsidian";
import { campaignOfCharacter } from "../campaign/campaign-folders";
import type { SheetNotes } from "./sheet-notes";

export interface CastPages {
  notes: Pick<SheetNotes, "fileAt" | "campaignFolders">;
  gallery(contentEl: HTMLElement): Component;
  character(contentEl: HTMLElement, file: TFile): Component;
}

function characterFileAt(path: string | null, notes: CastPages["notes"]): TFile | null {
  if (path === null) return null;
  if (campaignOfCharacter(path, notes.campaignFolders()) === null) return null;
  return notes.fileAt(path);
}

export function castPageFor(contentEl: HTMLElement, path: string | null, pages: CastPages): Component {
  const file = characterFileAt(path, pages.notes);
  if (file === null) return pages.gallery(contentEl);
  return pages.character(contentEl, file);
}
