import { BACKUP_STANDING, BACKUP_WORDS } from "../../layout/standing";
import type { LeavingReason, LeavingSteps } from "./leaving-reason";
import type { PlannedWrite } from "../writes/planned-write";

export class Backup implements LeavingReason {
  readonly words = BACKUP_WORDS;

  async writesFor(steps: LeavingSteps): Promise<PlannedWrite[]> {
    return steps.markedOnly(BACKUP_STANDING);
  }
}
