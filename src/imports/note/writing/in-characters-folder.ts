import { notACharacterNote } from "./refusals";

const NOTE_EXTENSION = ".md";
const SLASH = "/";

export function refuseUnlessCharacterNote(path: string, charactersFolder: string): void {
  const inside = `${charactersFolder}${SLASH}`;
  if (!path.startsWith(inside)) throw notACharacterNote(path);
  const rest = path.slice(inside.length);
  if (rest.includes(SLASH) || !rest.endsWith(NOTE_EXTENSION)) throw notACharacterNote(path);
}
