import type { TFile } from "obsidian";
import type { CharacterCard } from "./character-card";
import type { CharacterNotes } from "./character-notes";
import type { LearnedFacts } from "./learned-facts";
import { overrideFacts, sheetValuesOf } from "./sheet-values";

export async function readCharacterCard(file: TFile, learnedFacts: LearnedFacts, notes: CharacterNotes): Promise<CharacterCard> {
  const ownNote = await notes.textOf(file);
  let learned = learnedFacts.get(file.path);
  if (learned === undefined) learned = [];
  return {
    path: file.path,
    name: file.basename,
    values: sheetValuesOf(learned, overrideFacts(ownNote, file.path)),
    isOwn: notes.isOwnCharacter(file),
  };
}
