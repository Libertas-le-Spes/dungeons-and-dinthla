import type { CampaignMaker } from "../../campaign/writing/campaign-maker";
import type { CampaignsFolderSetup } from "../../settings/choosing/campaigns-folder-setup";
import { campaignsFolderThere, type FolderLookup } from "../../welcome/page/campaigns-folder-there";
import { WelcomePage, type WelcomeStore } from "../../welcome/page/welcome-page";
import type { MakePage } from "../view/campaign-pages";

export interface WelcomeNeeds {
  store: WelcomeStore;
  campaignsFolderSetup: Pick<CampaignsFolderSetup, "path" | "pick" | "make">;
  maker: Pick<CampaignMaker, "make">;
  files: FolderLookup;
  startSession(): void;
}

function nothingMore(): void {}

export function welcomeSection(needs: WelcomeNeeds): MakePage {
  return (contentEl, show) =>
    new WelcomePage(contentEl, needs.store, () => campaignsFolderThere(needs.campaignsFolderSetup.path, needs.files), {
      startSession: () => needs.startSession(),
      showCampaign: () => show({ page: "home", path: null }),
      makeCampaign: (name: string) => needs.maker.make(name),
      pickCampaignsFolder: () => needs.campaignsFolderSetup.pick(nothingMore),
      makeCampaignsFolder: (name: string) => needs.campaignsFolderSetup.make(name),
    });
}
