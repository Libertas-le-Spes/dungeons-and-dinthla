import { withEscapedCharacters } from "./character-escapes";
import { withoutFactStart, withoutListNumberStart, withoutMarkerStart } from "./line-start-guard";

export function guardedLineOf(text: string): string {
  return withoutMarkerStart(withoutListNumberStart(withoutFactStart(withEscapedCharacters(text))));
}
