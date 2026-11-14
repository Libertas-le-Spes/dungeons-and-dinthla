import type { RepliedCharacter } from "../../../beyond/reply/replied-character";
import type { LineLoss } from "../../../beyond/sheet/lines/line-loss";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";

const NOTHING_LEFT_OUT: LineLoss = { tooLong: 0, notClean: 0 };

export function onlineSheetOf(replied: RepliedCharacter): PrintedSheet {
  return { character: replied.character, leftOut: { items: NOTHING_LEFT_OUT, spells: NOTHING_LEFT_OUT, features: NOTHING_LEFT_OUT } };
}
