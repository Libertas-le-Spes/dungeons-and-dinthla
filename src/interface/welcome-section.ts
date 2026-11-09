import type { CampaignMaker } from "../campaign/campaign-maker";
import type { CampaignsFolderSetup } from "../settings/campaigns-folder-setup";
import { WelcomePage, type WelcomeStore } from "../welcome/welcome-page";
import type { MakePage } from "./campaign-pages";

export interface WelcomeNeeds {
  store: WelcomeStore;
  campaignsFolder: Pick<CampaignsFolderSetup, "path" | "pick" | "make">;
  maker: Pick<CampaignMaker, "make">;
  startSession(): void;
}

export function welcomeSection(needs: WelcomeNeeds): MakePage {
  return (contentEl, show) =>
    new WelcomePage(contentEl, needs.store, () => needs.campaignsFolder.path, {
      startSession: () => needs.startSession(),
      showCampaign: () => show({ page: "home", path: null }),
      makeCampaign: (name: string) => needs.maker.make(name),
      pickCampaignsFolder: () => needs.campaignsFolder.pick(() => {}),
      makeCampaignsFolder: (name: string) => needs.campaignsFolder.make(name),
    });
}
