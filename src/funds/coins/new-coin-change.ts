import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { notHidden } from "../../campaign/changes/hidden-refusal";
import type { RecordChange } from "../../campaign/changes/record-change";
import { linesAddedTo } from "../../campaign/changes/session-change";
import type { CoinLine } from "../../notes/writing/coin-lines";

export function newCoin(store: Pick<CampaignStore, "sessionNotes">, written: CoinLine, sessionPath: string): RecordChange<CoinLine> {
  const addedLine = (plan: CoinLine) => linesAddedTo(sessionPath, [plan.line]);
  return {
    plan: () => written,
    checks: [notHidden(() => store.sessionNotes, addedLine)],
    sessionChangeOf: addedLine,
  };
}
