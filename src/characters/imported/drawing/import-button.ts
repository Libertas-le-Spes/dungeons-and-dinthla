import type { ButtonAction } from "../../../views/components/buttons/action-button";
import type { ViewElement } from "../../../views/elements/view-element";
import { beyondButton } from "./beyond-button";

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

export function importButton(creators: ImportAction): ViewElement {
  return beyondButton(IMPORT_FROM_BEYOND, new ImportRun(creators));
}
