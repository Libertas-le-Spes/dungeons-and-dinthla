import type { Lookup, LookupKind } from "./lookup";

interface HeadingWords {
  pick: string;
  noMatch: string;
  none: string;
}

const HEADINGS: Record<LookupKind, HeadingWords> = {
  question: { pick: "Pick the question to answer", noMatch: "No open question matches", none: "No open questions" },
  quest: { pick: "Pick the quest to update", noMatch: "No active quest matches", none: "No active quests" },
  item: { pick: "Pick the item to update", noMatch: "No held item matches", none: "No held items" },
};

export interface LookupCounts {
  matching: number;
  open: number;
}

export function lookupHeadingOf(lookup: Lookup, counts: LookupCounts): string {
  const words = HEADINGS[lookup.kind];
  if (counts.matching > 0) return words.pick;
  if (counts.open === 0) return words.none;
  return `${words.noMatch} “${lookup.keywords.join(" ")}”`;
}
