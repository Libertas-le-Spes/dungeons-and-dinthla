import { characterCountOf } from "../../../beyond/shape/character-count";
import { neutralLineOf } from "./neutral-line";
import { MOST_LAST_DOING } from "./record-limits";
import { lastDoingNotOneLine, lastDoingTooLong } from "./record-refusals";

export function lastDoingOf(typed: string): string | null {
  const trimmed = typed.trim();
  if (trimmed === "") return null;
  if (characterCountOf(trimmed) > MOST_LAST_DOING) throw lastDoingTooLong();
  const line = neutralLineOf(trimmed);
  if (line === null) throw lastDoingNotOneLine();
  return line;
}
