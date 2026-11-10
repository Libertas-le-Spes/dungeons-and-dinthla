import type { Campaign, Source } from "../campaign/campaign";
import { holderNameOf } from "../funds/item-groups";
import { LOOKUP_SYMBOL_LIST, lookedUpKindBySymbol } from "../kinds/looked-up-kinds";
import type { LookupKindName } from "../kinds/lookup-kind-name";
import { symbolPatternOf } from "../kinds/symbol-pattern";
import { readItemChange } from "../notes/item-change";
import { unlink } from "../notes/link";
import { listQuestions } from "../questions/question-list";
import { listQuests } from "../quests/quest-list";
import { keywordsOf } from "../views/keywords";

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
    return listQuests(campaign, lookup.keywords).open.map((record) => ({ kind: "quest", text: record.text, holder: "", source: record.source }));
  }
  return heldItemMatches(campaign, lookup.keywords);
}

export function lookupMatches(campaign: Campaign, lookup: Lookup): LookupMatch[] {
  return allMatches(campaign, lookup).slice(0, LOOKUP_LIMIT);
}
