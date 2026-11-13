import type { SourcedFact } from "../../reading/sheet-values";

export interface ImportedFact extends SourcedFact {
  readonly route: string;
  readonly working: string;
}
