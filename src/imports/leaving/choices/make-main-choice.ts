import { MAKE_MAIN_WORDS } from "../../layout/standing";
import { WriteSequence } from "../writes/write-sequence";
import type { PlannedWrite } from "../writes/planned-write";
import type { AskedNote } from "../switching/asked-note";
import type { CampaignCast } from "../cast/campaign-cast";
import type { MainSwitch } from "../switching/main-switch";
import { OldMainSteps } from "../switching/old-main-steps";
import type { SwitchChoice } from "./switch-choice";
import type { LeavingActions, LeavingFiles } from "../switching/switch-plan";

export class MakeMainChoice implements SwitchChoice {
  readonly words = MAKE_MAIN_WORDS;

  constructor(
    private readonly files: LeavingFiles,
    private readonly actions: LeavingActions,
    private readonly cast: CampaignCast,
    private readonly mainSwitch: MainSwitch,
    private readonly old: AskedNote | null,
  ) {}

  async run(): Promise<boolean> {
    await this.mainSwitch.checkStill(this.old);
    const oldWrites = await this.oldWrites();
    const chosenWrites = await this.mainSwitch.chosenWrites();
    await new WriteSequence([...oldWrites, ...chosenWrites]).run();
    return true;
  }

  private async oldWrites(): Promise<PlannedWrite[]> {
    if (this.old === null) return [];
    return new OldMainSteps(this.files, this.actions, this.cast, this.mainSwitch.plan, this.old.file, "").finishing();
  }
}
