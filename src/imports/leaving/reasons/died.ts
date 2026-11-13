import { DIED_STANDING, DIED_WORDS } from "../../layout/standing";
import type { LeavingReason, LeavingSteps } from "./leaving-reason";

export class Died implements LeavingReason {
  readonly words = DIED_WORDS;

  async leave(steps: LeavingSteps): Promise<void> {
    await steps.recordThenStanding(DIED_STANDING, this.words);
  }
}
