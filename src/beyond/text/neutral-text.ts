import { cleanTextOf } from "./clean-text";
import { withEscapedCharacters } from "./character-escapes";
import { withoutFactStart, withoutMarkerStart } from "./line-start-guard";

function neutralLineOf(line: string): string {
  const escaped = withEscapedCharacters(line.trim());
  return withoutMarkerStart(withoutFactStart(escaped));
}

export function neutralTextOf(text: string): string {
  return cleanTextOf(text).split("\n").map(neutralLineOf).join("\n");
}
