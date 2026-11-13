import { addBeyondButton, type ButtonAction } from "./beyond-button";

export const IMPORT_FROM_BEYOND = "Import from D&D Beyond";

export interface ImportAction {
  importCharacter(returnFocus: () => void): void;
}

class ImportRun implements ButtonAction {
  constructor(private readonly creators: ImportAction) {}

  run(returnFocus: () => void): void {
    this.creators.importCharacter(returnFocus);
  }
}

export function addImportButton(head: HTMLElement, creators: ImportAction): void {
  addBeyondButton(head, IMPORT_FROM_BEYOND, new ImportRun(creators));
}
