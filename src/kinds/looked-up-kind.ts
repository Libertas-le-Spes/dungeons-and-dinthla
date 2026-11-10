import type { LookupKindName } from "./lookup-kind-name";
import type { LookupOpeners } from "./lookup-openers";
import type { Source } from "./source";
import type { TrackedKind } from "./tracked-kind";

export interface LookupWords {
  pick: string;
  noMatch: string;
  none: string;
}

export interface KindLookup {
  symbol: string;
  words: LookupWords;
  showsHolder: boolean;
  open(openers: LookupOpeners, text: string, source: Source, onClosed: () => void): void;
}

export interface LookedUpKind extends TrackedKind {
  name: LookupKindName;
  lookup: KindLookup;
}
