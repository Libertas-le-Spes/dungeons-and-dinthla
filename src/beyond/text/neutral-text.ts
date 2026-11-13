import type { CleanLine } from "./clean-line";
import { cleanTextOf, NEW_LINE } from "./clean-text";
import { guardedLineOf } from "../../imports/layout/guarded-line";

function neutralLineOf(line: string): string {
  return guardedLineOf(line.trim());
}

function neutralLinesOf(text: string): string {
  return text.split(NEW_LINE).map(neutralLineOf).join(NEW_LINE);
}

export class NeutralText {
  private constructor(readonly written: string) {}

  static ofLines(text: string): NeutralText {
    return new NeutralText(neutralLinesOf(cleanTextOf(text)));
  }

  static ofOneLine(line: CleanLine): NeutralText {
    return new NeutralText(neutralLineOf(line.text));
  }
}
