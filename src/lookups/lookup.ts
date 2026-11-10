import type { Campaign, Source, SourcedText } from "../campaign/campaign";
import type { ThreadRecord } from "../campaign/thread-kind";
import { holderNameOf } from "../funds/item-groups";
import type { FollowUpName } from "../kinds/follow-up-name";
import { LOOKUP_SYMBOL_LIST, lookedUpKindBySymbol, lookedUpKindNamed } from "../kinds/looked-up-kinds";
import type { LookupFinders } from "../kinds/lookup-finders";
import type { LookupKindName } from "../kinds/lookup-kind-name";
import { symbolPatternOf } from "../kinds/symbol-pattern";
import { readItemChange } from "../notes/item-change";
import { unlink } from "../notes/link";
import { questionShownKind } from "../questions/question-shown-kind";
import { questShownKind } from "../quests/quest-shown-kind";
import { keywordsOf } from "../views/keywords";
import type { ShownThreadKind } from "../views/shown-thread-kind";
import { listThreads } from "../views/thread-list";

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

function openThreadMatches<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  campaign: Campaign,
  keywords: string[],
): LookupMatch[] {
  const kind = shown.kind;
  return listThreads(shown, campaign, keywords).open.map((thread) => ({ kind: kind.tracked.name, text: kind.textOf(thread), holder: "", source: thread.source }));
}

function heldItemMatches(campaign: Campaign, keywords: string[]): LookupMatch[] {
  const held = [...campaign.items].reverse().filter((item) => item.gone === null);
  return held
    .filter((item) => {
      const text = unlink(`${item.name} ${holderNameOf(item.holder)}`).toLowerCase();
      return keywords.every((keyword) => text.includes(keyword));
    })
    .map((item) => ({ kind: "item", text: item.name, holder: holderNameOf(item.holder), source: item.source }));
}

function findersIn(campaign: Campaign): LookupFinders<LookupMatch> {
  return {
    question: (keywords) => openThreadMatches(questionShownKind, campaign, keywords),
    quest: (keywords) => openThreadMatches(questShownKind, campaign, keywords),
    item: (keywords) => heldItemMatches(campaign, keywords),
  };
}

export function lookupMatches(campaign: Campaign, lookup: Lookup): LookupMatch[] {
  const matches = lookedUpKindNamed(lookup.kind).lookup.find(findersIn(campaign), lookup.keywords);
  return matches.slice(0, LOOKUP_LIMIT);
}
