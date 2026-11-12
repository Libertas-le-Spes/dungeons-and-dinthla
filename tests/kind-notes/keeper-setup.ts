import type { TFile } from "obsidian";
import { KindNoteKeeper } from "../../src/kind-notes/kind-note-keeper";
import type { WantedNote } from "../../src/kind-notes/wanted-note";
import { FakeNotes } from "./fake-notes";

export const CAMPAIGN = "D&D/Pale Moon";
export const SESSION = `${CAMPAIGN}/Sessions/Session 2.md`;
export const QUESTIONS = `${CAMPAIGN}/Questions/Session 2.md`;
export const FUNDS = `${CAMPAIGN}/Funds/Session 2.md`;

export function keeperWith(notes: FakeNotes): KindNoteKeeper {
  return new KindNoteKeeper(notes.needs());
}

export function wanted(path: string, sessionFile: TFile | null, lines: string[], sessionPath = SESSION): WantedNote {
  const folder = path.slice(path.lastIndexOf("/", path.lastIndexOf("/") - 1) + 1, path.lastIndexOf("/"));
  return { path, folder, sessionPath, sessionFile, lines };
}

export async function settled(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
