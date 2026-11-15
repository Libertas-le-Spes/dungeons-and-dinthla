import { isCharacterNotePath } from "../../../../campaign/paths/character-note-path";
import { notACharacterNote } from "./refusals";

export function refuseUnlessCharacterNote(path: string, charactersFolder: string): void {
  if (!isCharacterNotePath(path, charactersFolder)) throw notACharacterNote(path);
}
