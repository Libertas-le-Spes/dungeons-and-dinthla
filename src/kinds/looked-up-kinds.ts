import type { LookedUpKind } from "./looked-up-kind";
import { LOOKUP_KIND_NAMES, type LookupKindName } from "./lookup-kind-name";
import { TRACKED_KINDS } from "./tracked-kinds";

const LOOKED_UP_KINDS = {
  question: TRACKED_KINDS.question,
  quest: TRACKED_KINDS.quest,
  item: TRACKED_KINDS.item,
} satisfies Record<LookupKindName, LookedUpKind>;

export function lookedUpKindNamed(name: LookupKindName): LookedUpKind {
  return LOOKED_UP_KINDS[name];
}

const ALL_LOOKED_UP: LookedUpKind[] = LOOKUP_KIND_NAMES.map(lookedUpKindNamed);

export const LOOKUP_SYMBOL_LIST: string[] = ALL_LOOKED_UP.map((kind) => kind.lookup.symbol);

const KINDS_BY_SYMBOL = new Map<string, LookedUpKind>(ALL_LOOKED_UP.map((kind) => [kind.lookup.symbol, kind]));

export function lookedUpKindBySymbol(symbol: string): LookedUpKind | undefined {
  return KINDS_BY_SYMBOL.get(symbol);
}
