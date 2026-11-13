export interface LeavingSteps {
  recordThenStanding(standing: string, how: string): Promise<void>;
  standingOnly(standing: string): Promise<void>;
}

export interface LeavingReason {
  readonly words: string;
  leave(steps: LeavingSteps): Promise<void>;
}
