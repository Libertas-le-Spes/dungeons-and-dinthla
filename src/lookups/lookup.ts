import type { Campaign, Source, SourcedText } from "../campaign/record/campaign";
import type { ThreadRecord } from "../campaign/threads/thread-kind";
import { holderNameOf } from "../funds/items/item-groups";
import type { FollowUpName } from "../kinds/follow-up-name";
import { itemTrackedKind } from "../kinds/item-tracked-kind";
import { LOOKUP_SYMBOL_LIST, lookedUpKindBySymbol } from "../kinds/looked-up-kinds";
import type { LookupKindName } from "../kinds/lookup-kind-name";
import { symbolPatternOf } from "../kinds/symbol-pattern";
import type { TrackedKindName } from "../kinds/tracked-kind";
import { readItemChange } from "../notes/reading/item-change";
import { unlink } from "../notes/parts/link";
import { keywordsOf } from "../views/lists/keywords";
import type { ShownThreadKind } from "../views/threads/shown-thread-kind";
import { SHOWN_THREAD_KINDS } from "../views/threads/shown-thread-kinds";
import { listThreads } from "../views/threads/thread-list";

export interface Lookup {
  kind: LookupKindName;
  keywords: string[];
}

export interface LookupMatch {
  kind: LookupKindName;
  text: string;
  holder: string;
  source: Source;
}

export const LOOKUP_LIMIT = 8;
const LOOKUP_LINE = new RegExp(`^\\s*(${symbolPatternOf(LOOKUP_SYMBOL_LIST)})\\s?(.*)$`);

export function readLookup(line: string): Lookup | null {
  const match = LOOKUP_LINE.exec(line);
  if (match === null) return null;
  const looked = lookedUpKindBySymbol(match[1]!);
  if (looked === undefined) return null;
  const kind = looked.name;
  const typed = match[2]!;
  if (kind === "item" && readItemChange(line) !== null) return null;
  return { kind, keywords: keywordsOf(typed) };
}

interface LookupMatcher {
  name: TrackedKindName;
  matchesIn(campaign: Campaign, lookup: Lookup): LookupMatch[];
}

function threadMatcherOf<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
): LookupMatcher {
  const threadKind = shown.threadKind;
  return {
    name: threadKind.tracked.name,
    matchesIn: (campaign, lookup) =>
      listThreads(shown, campaign, lookup.keywords).open.map((thread) => ({ kind: lookup.kind, text: threadKind.textOf(thread), holder: "", source: thread.source })),
  };
}

function heldItemMatches(campaign: Campaign, lookup: Lookup): LookupMatch[] {
  const held = [...campaign.items].reverse().filter((item) => item.gone === null);
  return held
    .filter((item) => {
      const text = unlink(`${item.name} ${holderNameOf(item.holder)}`).toLowerCase();
      return lookup.keywords.every((keyword) => text.includes(keyword));
    })
    .map((item) => ({ kind: lookup.kind, text: item.name, holder: holderNameOf(item.holder), source: item.source }));
}

const HELD_ITEMS: LookupMatcher = { name: itemTrackedKind.name, matchesIn: heldItemMatches };

const MATCHERS: LookupMatcher[] = [...SHOWN_THREAD_KINDS.map(threadMatcherOf), HELD_ITEMS];

export function lookupMatches(campaign: Campaign, lookup: Lookup): LookupMatch[] {
  const matchers = MATCHERS.filter((matcher) => matcher.name === lookup.kind);
  return matchers.flatMap((matcher) => matcher.matchesIn(campaign, lookup)).slice(0, LOOKUP_LIMIT);
}
