import type { TFile } from "obsidian";
import type { SessionNote } from "../campaign/campaign";
import type { CharacterCard } from "./character-card";
import type { CharacterNotes } from "./character-notes";
import { factsByCharacter, overrideFacts, sheetValuesOf, type SourcedFact } from "./sheet-values";

export type LearnedFacts = Map<string, SourcedFact[]>;

export function learnedFactsOf(sessions: SessionNote[], notes: CharacterNotes): LearnedFacts {
  return factsByCharacter(sessions, (linktext, sourcePath) => notes.pathOfLink(linktext, sourcePath));
}

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
