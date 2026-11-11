import type { RecordChange } from "../../campaign/changes/record-change";
import { linesAddedTo } from "../../campaign/changes/session-change";
import type { CoinLine } from "../../notes/writing/coin-lines";

export function newCoin(written: CoinLine, sessionPath: string): RecordChange<CoinLine> {
  return {
    plan: () => written,
    checks: [],
    sessionChangeOf: (plan) => linesAddedTo(sessionPath, [plan.line]),
  };
}
