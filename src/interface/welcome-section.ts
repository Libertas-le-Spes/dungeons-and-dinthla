import type { CampaignMaker } from "../campaign/campaign-maker";
import type { CampaignsFolderSetup } from "../settings/campaigns-folder-setup";
import { WelcomePage, type WelcomeStore } from "../welcome/welcome-page";
import type { MakePage } from "./campaign-pages";

export interface WelcomeNeeds {
  store: WelcomeStore;
  campaignsFolderSetup: Pick<CampaignsFolderSetup, "path" | "pick" | "make">;
  maker: Pick<CampaignMaker, "make">;
  startSession(): void;
}

function nothingMore(): void {}

export function welcomeSection(needs: WelcomeNeeds): MakePage {
  return (contentEl, show) =>
    new WelcomePage(contentEl, needs.store, () => needs.campaignsFolderSetup.path, {
      startSession: () => needs.startSession(),
      showCampaign: () => show({ page: "home", path: null }),
      makeCampaign: (name: string) => needs.maker.make(name),
      pickCampaignsFolder: () => needs.campaignsFolderSetup.pick(nothingMore),
      makeCampaignsFolder: (name: string) => needs.campaignsFolderSetup.make(name),
    });
}
