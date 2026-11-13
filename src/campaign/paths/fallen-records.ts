import { nameKeyOf } from "../../names/name-key";
import { fallenRecordPathOf } from "./campaign-folders";

export interface NamedNote {
  readonly path: string;
  readonly basename: string;
}

export function fallenRecordOf<T extends NamedNote>(notes: readonly T[], campaignFolder: string, name: string): T | null {
  const wanted = nameKeyOf(fallenRecordPathOf(campaignFolder, name));
  for (const note of notes) {
    if (nameKeyOf(note.path) === wanted) return note;
  }
  return null;
}

export function leftPlayWords(name: string): string {
  return `${name} left play in this campaign and has a record in Fallen, so no second note was made for them. Restore their own note to bring them back.`;
}
