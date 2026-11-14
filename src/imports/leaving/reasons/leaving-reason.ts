import type { PlannedWrite } from "../writes/planned-write";

export interface LeavingSteps {
  intoFallen(standing: string, how: string): Promise<PlannedWrite[]>;
  markedOnly(standing: string): Promise<PlannedWrite[]>;
}

export interface LeavingReason {
  readonly words: string;
  writesFor(steps: LeavingSteps): Promise<PlannedWrite[]>;
}
