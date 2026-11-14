import type { CampaignCast } from "../cast/campaign-cast";
import type { MainSwitch } from "../switching/main-switch";
import type { LeavingActions, LeavingFiles } from "../switching/switch-plan";

export interface QuestionParts {
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly cast: CampaignCast;
  readonly mainSwitch: MainSwitch;
}
