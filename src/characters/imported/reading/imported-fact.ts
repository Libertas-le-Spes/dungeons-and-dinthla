import type { SourcedFact } from "../../facts/sourced-fact";

export interface ImportedFact extends SourcedFact {
  readonly route: string;
  readonly working: string;
}
