import type { RecordChange } from "../../campaign/record-change";
import { linesAddedTo } from "../../campaign/session-change";
import type { CoinLine } from "../../notes/coin-lines";

export function newCoin(written: CoinLine, sessionPath: string): RecordChange<CoinLine> {
  return {
    plan: () => written,
    checks: [],
    sessionChangeOf: (plan) => linesAddedTo(sessionPath, [plan.line]),
  };
}
