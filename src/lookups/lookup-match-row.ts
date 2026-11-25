import { THE_PARTY_LABEL } from "../funds/items/item-groups";
import { textRunsOf } from "../views/components/rows/text-parts";
import { Mark, PlainText, Span } from "../views/elements/kinds/containers";
import type { ViewElement } from "../views/elements/view-element";
import { lookedUpKindNamed } from "../kinds/looked-up-kinds";
import type { LookupMatch } from "./lookup";

export const LOOKUP_CLASSES = ["dd-tokens", "dd-lookup"];

function markedText(text: string, keywords: string[]): ViewElement[] {
  const shown: ViewElement[] = [];
  for (const run of textRunsOf(text, keywords)) {
    for (const piece of run.pieces) {
      if (piece.marked) shown.push(new Mark({ text: piece.text }));
      else shown.push(new PlainText(piece.text));
    }
  }
  return shown;
}

function holderShownFor(match: LookupMatch): string {
  if (match.holder === "") return THE_PARTY_LABEL;
  return match.holder;
}

export function lookupMatchParts(match: LookupMatch, keywords: string[]): ViewElement[] {
  const kind = lookedUpKindNamed(match.kind);
  const parts: ViewElement[] = [
    new Span({ cls: ["dd-marker", kind.marker.colourClass], text: kind.marker.symbol }),
    new Span({ cls: ["dd-lookup-text"] }, markedText(match.text, keywords)),
  ];
  if (kind.lookup.showsHolder) parts.push(new Span({ cls: ["dd-lookup-holder"], text: holderShownFor(match) }));
  return parts;
}
