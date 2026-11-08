import type { Campaign, Source } from "../campaign/campaign";
import { holderNameOf } from "../funds/item-groups";
import { unlink } from "../notes/link";
import { listQuestions } from "../questions/question-list";
import { listQuests } from "../quests/quest-list";
import { keywordsOf } from "../views/keywords";

export type LookupKind = "question" | "quest" | "item";

export interface Lookup {
  kind: LookupKind;
  keywords: string[];
}

export interface LookupMatch {
  kind: LookupKind;
  text: string;
  holder: string;
  source: Source;
}

export const LOOKUP_LIMIT = 8;
const LOOKUP_LINE = /^\s*(\?\?|!!|\$\$)\s?(.*)$/;
const CHANGE_WORD = / :(changed to|sold|used|lost)\b/i;
const KINDS: Record<string, LookupKind> = { "??": "question", "!!": "quest", $$: "item" };

export function readLookup(line: string): Lookup | null {
  const match = LOOKUP_LINE.exec(line);
  if (match === null) return null;
  const kind = KINDS[match[1]!]!;
  const typed = match[2]!;
  if (kind === "item" && CHANGE_WORD.test(typed)) return null;
  return { kind, keywords: keywordsOf(typed) };
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

function allMatches(campaign: Campaign, lookup: Lookup): LookupMatch[] {
  if (lookup.kind === "question") {
    return listQuestions(campaign, lookup.keywords).open.map((question) => ({ kind: "question", text: question.text, holder: "", source: question.source }));
  }
  if (lookup.kind === "quest") {
    return listQuests(campaign, lookup.keywords).open.map((record) => ({ kind: "quest", text: record.quest.title, holder: "", source: record.source }));
  }
  return heldItemMatches(campaign, lookup.keywords);
}

export function lookupMatches(campaign: Campaign, lookup: Lookup): LookupMatch[] {
  return allMatches(campaign, lookup).slice(0, LOOKUP_LIMIT);
}
