import { cardClasses, cardLabels, statValueOf } from "../../characters/cards/drawing/card-parts";
import type { CharacterCard } from "../../characters/cards/character-card";
import { SourceRow } from "../../views/components/rows/source-row";
import type { PageAction } from "../../views/elements/bindings/page-action";
import { Div, ListItem, PlainText, Strong } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

const SHORT_CARD_LINES = [
  { label: "Class", name: "class" },
  { label: "AC", name: "AC" },
  { label: "HP", name: "HP" },
];

const BETWEEN_LINES = " · ";

export class ShortCharacterCard {
  build(card: CharacterCard, open: PageAction): ListItem {
    const line: ViewElement[] = [];
    for (const { label, name } of SHORT_CARD_LINES) {
      if (line.length > 0) line.push(new PlainText(BETWEEN_LINES));
      line.push(new Strong({ text: label }), new PlainText(" "), statValueOf(card.values, name));
    }
    const children = [...cardLabels(card), new Div({ cls: ["dd-stat-block-name"], text: card.name }), new Div({ cls: ["dd-stat-block-line"] }, line)];
    const row = new SourceRow({ path: card.path, line: 0 }, open).build(children, { cls: [...cardClasses(card), "dd-stat-block"], bindings: [] });
    return new ListItem({}, [row]);
  }
}
