import type { SessionNote } from "../campaign/campaign";
import type { CharacterNotes } from "./character-notes";
import { factsByCharacter, type SourcedFact } from "./sheet-values";

export type LearnedFacts = Map<string, SourcedFact[]>;

export function learnedFactsOf(sessions: SessionNote[], notes: CharacterNotes): LearnedFacts {
  return factsByCharacter(sessions, (linktext, sourcePath) => notes.pathOfLink(linktext, sourcePath));
}
