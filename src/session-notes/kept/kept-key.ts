import type { KeptKind } from "./kinds/kept-kind";
import { KEPT_KINDS } from "./kinds/kept-kinds";

const TIME_END = ":";

export interface KeptKey {
  kind: KeptKind;
  path: string;
  keptAt: number;
}

export function keptKeyOf(kind: KeptKind, path: string, keptAt: number): string {
  return `${kind.start}${keptAt}${TIME_END}${path}`;
}

function kindOf(key: string): KeptKind | null {
  for (const kind of KEPT_KINDS) {
    if (key.startsWith(kind.start)) return kind;
  }
  return null;
}

function partsAfter(kind: KeptKind, key: string): KeptKey | null {
  const rest = key.substring(kind.start.length);
  const timeEnd = rest.indexOf(TIME_END);
  if (timeEnd < 1) return null;
  const keptAt = Number(rest.substring(0, timeEnd));
  if (!Number.isSafeInteger(keptAt)) return null;
  return { kind, path: rest.substring(timeEnd + TIME_END.length), keptAt };
}

export function keptKeyIn(key: string): KeptKey | null {
  const kind = kindOf(key);
  if (kind === null) return null;
  return partsAfter(kind, key);
}
