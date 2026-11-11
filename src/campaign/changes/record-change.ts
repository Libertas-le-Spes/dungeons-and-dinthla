import type { SessionChange } from "./session-change";
import type { Verdict } from "./verdict";

export type Check<Plan> = (plan: Plan) => Verdict | Promise<Verdict>;

export interface RecordChange<Plan> {
  plan(): Plan | { error: string };
  checks: Check<Plan>[];
  sessionChangeOf(plan: Plan): SessionChange;
}
