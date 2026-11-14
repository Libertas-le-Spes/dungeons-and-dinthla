import { DIED_STANDING, DIED_WORDS } from "../../layout/standing";
import type { LeavingReason, LeavingSteps } from "./leaving-reason";
import type { PlannedWrite } from "../writes/planned-write";

export class Died implements LeavingReason {
  readonly words = DIED_WORDS;

  async writesFor(steps: LeavingSteps): Promise<PlannedWrite[]> {
    return steps.intoFallen(DIED_STANDING, this.words);
  }
}
