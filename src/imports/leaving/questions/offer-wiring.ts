import type { DialogShowing } from "../../../views/dialogs/dialog-view";
import type { CampaignCast } from "../cast/campaign-cast";
import type { LeavingActions, LeavingFiles } from "../switching/switch-plan";

export interface OfferWiring {
  readonly showing: DialogShowing;
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly cast: CampaignCast;
  campaignFolderOf(path: string): string | null;
  today(): string;
  tell(words: string): void;
}
