import type { Refused, Verdict } from "./verdict";

export type Check<Plan> = (plan: Plan) => Verdict | Promise<Verdict>;

export interface RecordChange<Plan extends object> {
  plan(): Plan | Refused;
  checks: Check<Plan>[];
  writePlan(plan: Plan): Promise<boolean>;
}
