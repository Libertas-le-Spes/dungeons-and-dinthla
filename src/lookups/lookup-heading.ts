import { lookedUpKindNamed } from "../kinds/looked-up-kinds";
import type { Lookup } from "./lookup";

export interface LookupCounts {
  matching: number;
  open: number;
}

export function lookupHeadingOf(lookup: Lookup, counts: LookupCounts): string {
  const words = lookedUpKindNamed(lookup.kind).lookupWords;
  if (counts.matching > 0) return words.pick;
  if (counts.open === 0) return words.none;
  return `${words.noMatch} “${lookup.keywords.join(" ")}”`;
}
