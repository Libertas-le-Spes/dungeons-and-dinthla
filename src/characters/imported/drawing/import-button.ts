import type { CharacterCreators } from "../../pages/character-creators";
import type { ButtonAction } from "./action-button";
import { addBeyondButton } from "./beyond-button";

export const IMPORT_FROM_BEYOND = "Import from D&D Beyond";

class ImportRun implements ButtonAction {
  constructor(private readonly creators: CharacterCreators) {}

  run(returnFocus: () => void): void {
    this.creators.importCharacter(returnFocus);
  }
}

export function addImportButton(head: HTMLElement, creators: CharacterCreators): void {
  addBeyondButton(head, IMPORT_FROM_BEYOND, new ImportRun(creators));
}
