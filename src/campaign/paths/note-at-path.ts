import { nameKeyOf } from "../../names/name-key";

export interface NamedNote {
  readonly path: string;
  readonly basename: string;
}

export function noteAtPathOf<T extends NamedNote>(notes: readonly T[], path: string): T | null {
  const wanted = nameKeyOf(path);
  for (const note of notes) {
    if (nameKeyOf(note.path) === wanted) return note;
  }
  return null;
}
