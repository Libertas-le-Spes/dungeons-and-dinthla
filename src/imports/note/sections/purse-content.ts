import type { Purse } from "../../../beyond/shape/purse";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { WorkedValue } from "../../../beyond/shape/worked-value";
import { PURSE_SECTION } from "../../layout/plugin-sections";
import { pluginLineOf } from "./plugin-line";
import type { SectionContent } from "./section-content";
import { valueTextOf } from "./worked-text";

function coinLineOf(coin: string, count: WorkedValue<number>): string {
  return pluginLineOf([coin, valueTextOf(count)]);
}

function coinLinesOf(purse: Purse): string[] {
  return [
    coinLineOf("pp", purse.platinum),
    coinLineOf("gp", purse.gold),
    coinLineOf("ep", purse.electrum),
    coinLineOf("sp", purse.silver),
    coinLineOf("cp", purse.copper),
  ];
}

export class PurseContent implements SectionContent {
  readonly section = PURSE_SECTION;

  linesOf(sheet: PrintedSheet): string[] {
    return coinLinesOf(sheet.character.purse);
  }
}
