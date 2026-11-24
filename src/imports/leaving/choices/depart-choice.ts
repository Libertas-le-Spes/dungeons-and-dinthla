import type { LeavingReason } from "../reasons/leaving-reason";
import { WriteSequence } from "../writes/write-sequence";
import type { AskedNote } from "../switching/asked-note";
import type { CampaignCast } from "../cast/campaign-cast";
import type { MainSwitch } from "../switching/main-switch";
import type { LeavingActions, LeavingFiles } from "../switching/switch-plan";
import { OldMainSteps } from "../switching/old-main-steps";
import type { SwitchChoice } from "./switch-choice";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export interface DepartParts {
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly cast: CampaignCast;
  readonly mainSwitch: MainSwitch;
}

export class DepartChoice implements SwitchChoice {
  readonly words: string;

  constructor(
    private readonly parts: DepartParts,
    private readonly note: AskedNote,
    private readonly reason: LeavingReason,
    private readonly syntax: PropertiesSyntax,
  ) {
    this.words = reason.words;
  }

  async run(typedLastDoing: string): Promise<boolean> {
    const { files, actions, cast, mainSwitch } = this.parts;
    await mainSwitch.checkStill(null);
    const steps = new OldMainSteps(files, actions, cast, mainSwitch.plan, this.note.file, typedLastDoing, this.syntax);
    await new WriteSequence(await this.reason.writesFor(steps)).run();
    return true;
  }
}
