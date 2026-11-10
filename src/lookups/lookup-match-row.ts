import { THE_PARTY_LABEL } from "../funds/item-groups";
import { textRunsOf } from "../views/text-parts";
import { lookedUpKindNamed } from "../kinds/looked-up-kinds";
import type { LookupMatch } from "./lookup";

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
  const kind = lookedUpKindNamed(match.kind);
  el.createSpan({ cls: `dd-marker ${kind.marker.colourClass}`, text: kind.marker.symbol });
  addMarkedText(el.createSpan({ cls: "dd-lookup-text" }), match.text, keywords);
  if (kind.showsHolder) el.createSpan({ cls: "dd-lookup-holder", text: holderShownFor(match) });
}
