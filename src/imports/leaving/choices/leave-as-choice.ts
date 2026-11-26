import type { LeavingReason } from "../reasons/leaving-reason";
import { WriteSequence } from "../writes/write-sequence";
import type { AskedNote } from "../switching/asked-note";
import type { CampaignCast } from "../cast/campaign-cast";
import type { MainSwitch } from "../switching/main-switch";
import { OldMainSteps } from "../switching/old-main-steps";
import type { SwitchChoice } from "./switch-choice";
import type { LeavingActions, LeavingFiles } from "../switching/switch-plan";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export class LeaveAsChoice implements SwitchChoice {
  readonly words: string;

  constructor(
    private readonly files: LeavingFiles,
    private readonly actions: LeavingActions,
    private readonly cast: CampaignCast,
    private readonly mainSwitch: MainSwitch,
    private readonly old: AskedNote,
    private readonly reason: LeavingReason,
    private readonly syntax: PropertiesSyntax,
  ) {
    this.words = reason.words;
  }

  async run(typedLastDoing: string): Promise<boolean> {
    await this.mainSwitch.checkStill(this.old);
    const steps = new OldMainSteps(this.files, this.actions, this.cast, this.mainSwitch.plan, this.old.file, typedLastDoing, this.syntax);
    const oldWrites = await this.reason.writesFor(steps);
    const chosenWrites = await this.mainSwitch.chosenWrites();
    await new WriteSequence([...oldWrites, ...chosenWrites]).run();
    return true;
  }
}
