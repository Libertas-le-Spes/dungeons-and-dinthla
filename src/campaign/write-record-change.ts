import type { RecordChange } from "./record-change";

export async function writeRecordChange<Plan extends object>(change: RecordChange<Plan>): Promise<boolean> {
  const plan = change.plan();
  if ("refused" in plan) throw new Error(plan.refused);
  for (const check of change.checks) {
    const verdict = await check(plan);
    if (verdict === "write nothing") return false;
    if (verdict !== "go on") throw new Error(verdict.refused);
  }
  return change.writePlan(plan);
}
