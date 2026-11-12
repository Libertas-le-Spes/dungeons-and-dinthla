import { NAME_LENGTH } from "../shape/import-limits";
import { emptyName, lineBreakInOneLine } from "../shape/refusal";
import { cleanTextOf, NEW_LINE } from "./clean-text";
import { limitedText } from "./limited-text";
import { plainTextOf } from "./plain-text";

export class CleanLine {
  private constructor(readonly text: string) {}

  static of(text: string): CleanLine {
    const cleaned = cleanTextOf(plainTextOf(text));
    if (cleaned.includes(NEW_LINE)) throw lineBreakInOneLine();
    const line = limitedText(cleaned.trim(), NAME_LENGTH);
    if (line === "") throw emptyName();
    return new CleanLine(line);
  }
}
