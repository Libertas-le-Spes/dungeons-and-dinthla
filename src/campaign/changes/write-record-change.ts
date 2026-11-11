import type { RecordChange } from "./record-change";
import type { SessionChangeWriter } from "./session-change-writer";
import { isError } from "./verdict";

export async function writeRecordChange<Plan>(change: RecordChange<Plan>, writer: Pick<SessionChangeWriter, "apply">): Promise<boolean> {
  const plan = change.plan();
  if (isError(plan)) throw new Error(plan.error);
  for (const check of change.checks) {
    const verdict = await check(plan);
    if (verdict === "write nothing") return false;
    if (verdict !== "go on") throw new Error(verdict.error);
  }
  return writer.apply(change.sessionChangeOf(plan));
}
