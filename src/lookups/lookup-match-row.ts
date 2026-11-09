import { THE_PARTY_LABEL } from "../funds/item-groups";
import { textRunsOf } from "../views/text-parts";
import type { LookupKind, LookupMatch } from "./lookup";

interface KindShown {
  text: string;
  cls: string;
  showsHolder: boolean;
}

const KINDS_SHOWN: Record<LookupKind, KindShown> = {
  question: { text: "?", cls: "dd-marker dd-marker-question", showsHolder: false },
  quest: { text: "!", cls: "dd-marker dd-marker-quest", showsHolder: false },
  item: { text: "$", cls: "dd-marker dd-marker-ledger", showsHolder: true },
};

function addMarkedText(parent: HTMLElement, text: string, keywords: string[]): void {
  for (const run of textRunsOf(text, keywords)) {
    for (const piece of run.pieces) {
      if (piece.marked) parent.createEl("mark", { text: piece.text });
      else parent.appendText(piece.text);
    }
  }
}

function holderShownFor(match: LookupMatch): string {
  if (match.holder === "") return THE_PARTY_LABEL;
  return match.holder;
}

export function addLookupMatch(el: HTMLElement, match: LookupMatch, keywords: string[]): void {
  el.addClass("dd-tokens", "dd-lookup");
  const shown = KINDS_SHOWN[match.kind];
  el.createSpan({ cls: shown.cls, text: shown.text });
  addMarkedText(el.createSpan({ cls: "dd-lookup-text" }), match.text, keywords);
  if (shown.showsHolder) el.createSpan({ cls: "dd-lookup-holder", text: holderShownFor(match) });
}
