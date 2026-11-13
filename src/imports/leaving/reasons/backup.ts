import { BACKUP_STANDING, BACKUP_WORDS } from "../../layout/standing";
import type { LeavingReason, LeavingSteps } from "./leaving-reason";

export class Backup implements LeavingReason {
  readonly words = BACKUP_WORDS;

  async leave(steps: LeavingSteps): Promise<void> {
    await steps.standingOnly(BACKUP_STANDING);
  }
}
