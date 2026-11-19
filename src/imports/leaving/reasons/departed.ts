import { SOMETHING_ELSE_WORDS } from "../../layout/standing";
import type { LeavingReason, LeavingSteps } from "./leaving-reason";
import type { OwnWords } from "./own-words";
import type { PlannedWrite } from "../writes/planned-write";

export class Departed implements LeavingReason {
  readonly words = SOMETHING_ELSE_WORDS;

  constructor(private readonly own: OwnWords) {}

  async writesFor(steps: LeavingSteps): Promise<PlannedWrite[]> {
    return steps.departedIntoFallen(this.own.words);
  }
}
