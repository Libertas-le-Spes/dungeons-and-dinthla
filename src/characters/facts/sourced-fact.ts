import type { Source } from "../../campaign/record/campaign";
import type { CharacterFact } from "../../notes/reading/character-facts";

export interface SourcedFact extends CharacterFact {
  source: Source;
}
