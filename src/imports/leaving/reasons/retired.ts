import { RETIRED_STANDING, RETIRED_WORDS } from "../../layout/standing";
import type { LeavingReason, LeavingSteps } from "./leaving-reason";

export class Retired implements LeavingReason {
  readonly words = RETIRED_WORDS;

  async leave(steps: LeavingSteps): Promise<void> {
    await steps.recordThenStanding(RETIRED_STANDING, this.words);
  }
}
