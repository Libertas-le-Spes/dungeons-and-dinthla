import type { PrintedSheet } from "../../../../beyond/sheet/printed-sheet";
import { NUMBERS_SECTION } from "../../../layout/plugin-sections";
import { SCORE_ROWS } from "../../rows/score-rows";
import { numberLineOf } from "../lines/number-line";
import type { SectionContent } from "./section-content";

export class NumbersContent implements SectionContent {
  readonly section = NUMBERS_SECTION;

  linesOf(sheet: PrintedSheet): string[] {
    const lines: string[] = [];
    for (const row of SCORE_ROWS) lines.push(numberLineOf(row.name, row.valueOf(sheet.character.scores)));
    for (const number of sheet.character.numbers) lines.push(numberLineOf(number.name, number.value));
    return lines;
  }
}
