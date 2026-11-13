import type { ImportedItem } from "../../../beyond/shape/imported-item";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { INVENTORY_SECTION } from "../../layout/plugin-sections";
import { COUNT_SEPARATOR } from "../../layout/section-line-format";
import { leftOutLinesOf } from "./left-out-line";
import { neutralPartOf, pluginLineOf } from "./plugin-line";
import type { SectionContent } from "./section-content";
import { countTextOf } from "./worked-text";

function itemLineOf(item: ImportedItem): string {
  return pluginLineOf([neutralPartOf(item.name.text), countTextOf(item.count)], COUNT_SEPARATOR);
}

export class InventoryContent implements SectionContent {
  readonly section = INVENTORY_SECTION;

  linesOf(sheet: PrintedSheet): string[] {
    const lines: string[] = [];
    for (const item of sheet.character.inventory) lines.push(itemLineOf(item));
    return [...lines, ...leftOutLinesOf(sheet.leftOut.items)];
  }
}
