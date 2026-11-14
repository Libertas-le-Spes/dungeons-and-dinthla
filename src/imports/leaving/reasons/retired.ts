import { RETIRED_STANDING, RETIRED_WORDS } from "../../layout/standing";
import type { LeavingReason, LeavingSteps } from "./leaving-reason";
import type { PlannedWrite } from "../writes/planned-write";

export class Retired implements LeavingReason {
  readonly words = RETIRED_WORDS;

  async writesFor(steps: LeavingSteps): Promise<PlannedWrite[]> {
    return steps.intoFallen(RETIRED_STANDING, this.words);
  }
}
