import { Died } from "../reasons/died";
import { WriteSequence } from "../writes/write-sequence";
import type { AskedNote } from "../switching/asked-note";
import type { CampaignCast } from "../cast/campaign-cast";
import type { MainSwitch } from "../switching/main-switch";
import type { LeavingActions, LeavingFiles } from "../switching/switch-plan";
import { OldMainSteps } from "../switching/old-main-steps";
import type { SwitchChoice } from "./switch-choice";

export interface DiedParts {
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly cast: CampaignCast;
  readonly mainSwitch: MainSwitch;
}

export class DiedChoice implements SwitchChoice {
  private readonly reason = new Died();
  readonly words = this.reason.words;

  constructor(
    private readonly parts: DiedParts,
    private readonly note: AskedNote,
  ) {}

  async run(typedLastDoing: string): Promise<boolean> {
    const { files, actions, cast, mainSwitch } = this.parts;
    await mainSwitch.checkStill(null);
    const steps = new OldMainSteps(files, actions, cast, mainSwitch.plan, this.note.file, typedLastDoing);
    await new WriteSequence(await this.reason.writesFor(steps)).run();
    return true;
  }
}
