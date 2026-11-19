import type { Component, TFile } from "obsidian";
import { campaignOfReference } from "../../campaign/paths/campaign-folders";
import { isFallenNotePath } from "../../campaign/paths/character-note-path";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import type { SheetNotes } from "../reading/sheet-notes";

export interface CastPages {
  notes: Pick<SheetNotes, "fileAt" | "campaignFolders">;
  gallery(contentEl: HTMLElement): Component;
  character(contentEl: HTMLElement, file: TFile): Component;
  fallen(contentEl: HTMLElement, file: TFile): Component;
}

function characterFileAt(path: string | null, notes: CastPages["notes"]): TFile | null {
  if (path === null) return null;
  if (campaignOfReference(characterReferenceKind, path, notes.campaignFolders()) === null) return null;
  return notes.fileAt(path);
}

function fallenFileAt(path: string | null, notes: CastPages["notes"]): TFile | null {
  if (path === null) return null;
  if (!isFallenNotePath(path, notes.campaignFolders())) return null;
  return notes.fileAt(path);
}

export function castPageFor(contentEl: HTMLElement, path: string | null, pages: CastPages): Component {
  const fallen = fallenFileAt(path, pages.notes);
  if (fallen !== null) return pages.fallen(contentEl, fallen);
  const file = characterFileAt(path, pages.notes);
  if (file === null) return pages.gallery(contentEl);
  return pages.character(contentEl, file);
}
