import type { Removal } from "../campaign/note-editor";
import type { SessionChange } from "../campaign/session-change";
import type { CoinLine } from "../notes/coin-lines";

export function coinSessionChange(removal: Removal, coinLine: CoinLine | null): SessionChange {
  if (coinLine === null) return { removal, rewrite: null, added: null, addedLater: null };
  return { removal: null, rewrite: { old: removal, line: coinLine.line }, added: null, addedLater: null };
}
