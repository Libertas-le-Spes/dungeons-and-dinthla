import { SourceRow } from "../../../views/components/rows/source-row";
import type { PageAction } from "../../../views/elements/bindings/page-action";
import type { Div } from "../../../views/elements/kinds/containers";
import { cardClasses, cardLabels } from "./card-parts";
import type { CharacterCard } from "../character-card";
import { STAT_BLOCK_CLASS, StatBlock } from "./stat-block-view";

export class FullCharacterCard {
  build(card: CharacterCard, open: PageAction): Div {
    const children = [...cardLabels(card), ...new StatBlock().build(card.name, card.values)];
    return new SourceRow({ path: card.path, line: 0 }, open).build(children, { cls: [...cardClasses(card), STAT_BLOCK_CLASS], bindings: [] });
  }
}
