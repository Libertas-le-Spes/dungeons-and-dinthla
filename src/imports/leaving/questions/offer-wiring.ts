import type { App } from "obsidian";
import type { CampaignCast } from "../cast/campaign-cast";
import type { LeavingActions, LeavingFiles } from "../switching/switch-plan";

export interface OfferWiring {
  readonly app: App;
  readonly files: LeavingFiles;
  readonly actions: LeavingActions;
  readonly cast: CampaignCast;
  campaignFolderOf(path: string): string | null;
  today(): string;
  tell(words: string): void;
}
