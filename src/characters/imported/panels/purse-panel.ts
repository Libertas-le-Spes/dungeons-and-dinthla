import { PURSE_SECTION } from "../../../imports/layout/plugin-sections";
import type { ImportedLists } from "../lists/imported-lists";
import { purseCoinsOf } from "../lists/purse-coin";
import { addCoinChips, NOT_IN_THE_PARTY_PURSE } from "../purse/coin-chips";
import type { SheetPanel } from "./sheet-panel";

export class PursePanel implements SheetPanel {
  addTo(root: HTMLElement, lists: ImportedLists): void {
    const coins = purseCoinsOf(lists.of(PURSE_SECTION).entries);
    const panel = root.createEl("section", { cls: "dd-sheet-panel" });
    panel.createDiv({ cls: "dd-head" }).createEl("h2", { cls: "dd-title", text: "Purse" });
    addCoinChips(panel, coins);
    panel.createEl("p", { cls: "dd-note", text: NOT_IN_THE_PARTY_PURSE });
  }
}
