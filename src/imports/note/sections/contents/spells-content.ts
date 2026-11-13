import type { PrintedSheet } from "../../../../beyond/sheet/printed-sheet";
import { SPELLS_SECTION } from "../../../layout/plugin-sections";
import { leftOutLinesOf } from "../lines/left-out-line";
import { listedLinesOf } from "../lines/listed-lines";
import type { SectionContent } from "./section-content";

export class SpellsContent implements SectionContent {
  readonly section = SPELLS_SECTION;

  linesOf(sheet: PrintedSheet): string[] {
    return [...listedLinesOf(sheet.character.spells), ...leftOutLinesOf(sheet.leftOut.spells)];
  }
}
