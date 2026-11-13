import type { TFile } from "obsidian";
import type { CharacterSheet, SheetValue } from "../../reading/character-sheet";
import type { ButtonAction } from "./action-button";
import { addBeyondButton } from "./beyond-button";

export const UPDATE_FROM_BEYOND = "Update from D&D Beyond";

export interface UpdateAction {
  updateFromBeyond(file: TFile, returnFocus: () => void): void;
}

class UpdateRun implements ButtonAction {
  constructor(
    private readonly file: TFile,
    private readonly action: UpdateAction,
  ) {}

  run(returnFocus: () => void): void {
    this.action.updateFromBeyond(this.file, returnFocus);
  }
}

function holdsAnImport(values: readonly SheetValue[]): boolean {
  for (const value of values) {
    if (value.imported !== null) return true;
  }
  return false;
}

export function isImportedSheet(sheet: CharacterSheet): boolean {
  return holdsAnImport(sheet.abilities) || holdsAnImport(sheet.values);
}

export function addUpdateButton(head: HTMLElement, file: TFile, sheet: CharacterSheet, action: UpdateAction): void {
  if (!isImportedSheet(sheet)) return;
  addBeyondButton(head, UPDATE_FROM_BEYOND, new UpdateRun(file, action));
}
