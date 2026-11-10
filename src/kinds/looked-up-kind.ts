import type { Source } from "../campaign/campaign";
import type { LookupKind, LookupMatch } from "../lookups/lookup";
import type { LookupOpeners } from "../lookups/open-match";
import type { SourceKind } from "./source-kind";

export interface LookupWords {
  pick: string;
  noMatch: string;
  none: string;
}

export interface LookedUpKind extends SourceKind {
  name: LookupKind;
  lookupSymbol: string;
  lookupWords: LookupWords;
  showsHolder: boolean;
  open(openers: LookupOpeners, match: LookupMatch, source: Source, onClosed: () => void): void;
}
