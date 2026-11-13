import type { PrintedSheet } from "../../../../beyond/sheet/printed-sheet";
import { FEATURES_SECTION } from "../../../layout/plugin-sections";
import { leftOutLinesOf } from "../lines/left-out-line";
import { listedLinesOf } from "../lines/listed-lines";
import type { SectionContent } from "./section-content";

export class FeaturesContent implements SectionContent {
  readonly section = FEATURES_SECTION;

  linesOf(sheet: PrintedSheet): string[] {
    return [...listedLinesOf(sheet.character.features), ...leftOutLinesOf(sheet.leftOut.features)];
  }
}
