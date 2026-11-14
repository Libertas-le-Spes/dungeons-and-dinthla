import type { Campaign } from "../../../campaign/record/campaign";
import { nameKeyOf } from "../../../names/name-key";
import { neutralLineOf } from "./neutral-line";
import type { Held } from "./snapshot-facts";
import { NEWEST_KEPT } from "./snapshot-limits";

function neutralLinesOf(texts: readonly string[]): string[] {
  const lines: string[] = [];
  for (const text of texts) {
    const line = neutralLineOf(text);
    if (line !== null) lines.push(line);
  }
  return lines;
}

function newestLines(texts: readonly string[]): string[] {
  return neutralLinesOf(texts).slice(-NEWEST_KEPT).reverse();
}

function holderNameOf(holder: string): string {
  return holder.slice(holder.lastIndexOf("/") + 1);
}

function heldBy(holder: string, name: string): boolean {
  return nameKeyOf(holderNameOf(holder)) === nameKeyOf(name);
}

export function heldOf(campaign: Campaign, name: string): Held {
  return {
    questions: newestLines(campaign.questions.filter((question) => question.answer === null).map((question) => question.text)),
    quests: newestLines(campaign.quests.filter((quest) => quest.outcome === null).map((quest) => quest.quest.title)),
    coins: newestLines(campaign.coins.map((coin) => coin.text)),
    items: neutralLinesOf(campaign.items.filter((item) => item.gone === null && heldBy(item.holder, name)).map((item) => item.name)),
  };
}
