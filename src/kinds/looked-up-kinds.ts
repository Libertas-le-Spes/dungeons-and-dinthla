import type { LookupKind } from "../lookups/lookup";
import type { LookedUpKind } from "./looked-up-kind";
import { LOOKED_UP_KINDS } from "./source-kinds";

const BY_NAME = new Map<LookupKind, LookedUpKind>(LOOKED_UP_KINDS.map((kind) => [kind.name, kind]));
const BY_SYMBOL = new Map<string, LookedUpKind>(LOOKED_UP_KINDS.map((kind) => [kind.lookupSymbol, kind]));

export function lookedUpKindNamed(name: LookupKind): LookedUpKind {
  return BY_NAME.get(name)!;
}

export function lookedUpKindOf(symbol: string): LookedUpKind {
  return BY_SYMBOL.get(symbol)!;
}
