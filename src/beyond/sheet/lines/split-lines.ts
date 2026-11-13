import { cleanTextOf, NEW_LINE } from "../../text/clean-text";

export function splitLines(text: string): readonly string[] {
  return cleanTextOf(text).split(NEW_LINE);
}
