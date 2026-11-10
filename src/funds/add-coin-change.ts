import type { RecordChange } from "../campaign/record-change";
import { linesAddedTo } from "../campaign/session-change";
import type { SessionChangeWriter } from "../campaign/session-change-writer";
import type { CoinLine } from "../notes/coin-lines";

export function addCoin(written: CoinLine, sessionPath: string, writer: SessionChangeWriter): RecordChange<CoinLine> {
  return {
    plan: () => written,
    checks: [],
    writePlan: (plan) => writer.apply(linesAddedTo(sessionPath, [plan.line])),
  };
}
