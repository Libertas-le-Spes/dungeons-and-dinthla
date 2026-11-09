import type { CampaignMaker } from "../campaign/campaign-maker";
import { WelcomePage, type WelcomeStore } from "../welcome/welcome-page";
import type { MakePage } from "./campaign-pages";

export interface WelcomeNeeds {
  store: WelcomeStore;
  maker: Pick<CampaignMaker, "make">;
  startSession(): void;
}

export function welcomeSection(needs: WelcomeNeeds): MakePage {
  return (contentEl, show) =>
    new WelcomePage(contentEl, needs.store, {
      startSession: () => needs.startSession(),
      showCampaign: () => show({ page: "home", path: null }),
      makeCampaign: (name: string) => needs.maker.make(name),
    });
}
