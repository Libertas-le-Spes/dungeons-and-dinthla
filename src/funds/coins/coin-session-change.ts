import type { Removal } from "../../campaign/writing/note-editor";
import { lineTakenOut, type SessionChange } from "../../campaign/changes/session-change";
import type { CoinLine } from "../../notes/coin-lines";

export function coinSessionChange(removal: Removal, coinLine: CoinLine | null): SessionChange {
  if (coinLine === null) return lineTakenOut(removal);
  return { rewrite: { old: removal, line: coinLine.line } };
}
