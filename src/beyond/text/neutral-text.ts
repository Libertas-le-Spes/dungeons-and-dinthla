import type { CleanLine } from "./clean-line";
import { cleanTextOf, NEW_LINE } from "./clean-text";
import { withEscapedCharacters } from "../../imports/layout/character-escapes";
import { withoutFactStart, withoutListNumberStart, withoutMarkerStart } from "./line-start-guard";

function neutralLineOf(line: string): string {
  const escaped = withEscapedCharacters(line.trim());
  return withoutMarkerStart(withoutListNumberStart(withoutFactStart(escaped)));
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
