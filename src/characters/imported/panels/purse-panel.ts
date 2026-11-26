import { PURSE_SECTION } from "../../../imports/layout/plugin-sections";
import { Div, Heading2, Section } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import type { ImportedLists } from "../lists/imported-lists";
import { purseCoinsOf } from "../lists/purse-coin";
import { coinChips } from "../purse/coin-chips";
import type { SheetPanel } from "./sheet-panel";

export class PursePanel implements SheetPanel {
  treeOf(lists: ImportedLists): ViewElement {
    const coins = purseCoinsOf(lists.of(PURSE_SECTION).entries);
    return new Section({ cls: ["dd-sheet-panel"] }, [new Div({ cls: ["dd-head"] }, [new Heading2({ cls: ["dd-title"], text: "Purse" })]), coinChips(coins)]);
  }
}
