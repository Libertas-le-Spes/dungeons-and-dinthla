import type { TFile } from "obsidian";
import { KindNoteKeeper } from "../../src/kind-notes/keeping/kind-note-keeper";
import { kindNoteFolders } from "../../src/kind-notes/wanting/sources/kind-note-sources";
import type { WantedNote } from "../../src/kind-notes/wanting/wanted-note";
import { FakeNotes } from "./fake-notes";

export const CAMPAIGN = "D&D/Pale Moon";
export const SESSION = `${CAMPAIGN}/Sessions/Session 2.md`;
export const QUESTIONS = `${CAMPAIGN}/Questions/Session 2.md`;
export const FUNDS = `${CAMPAIGN}/Funds/Session 2.md`;

export function keeperWith(notes: FakeNotes): KindNoteKeeper {
  return new KindNoteKeeper(notes.needs());
}

function folderOf(path: string): string {
  const found = kindNoteFolders().find((folder) => path.includes(`/${folder}/`));
  if (found === undefined) throw new Error(`${path} isn't in a kind note folder`);
  return found;
}

export function wanted(path: string, sessionFile: TFile | null, lines: string[], sessionPath = SESSION): WantedNote {
  const folder = folderOf(path);
  return { path, folder, sessionPath, sessionFile, lines };
}

export async function settled(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
