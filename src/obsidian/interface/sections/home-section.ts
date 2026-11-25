import type { CampaignStore } from "../../../campaign/reading/campaign-store";
import type { CharacterNotes } from "../../../characters/reading/character-notes";
import { DashboardPage, type DashboardActions } from "../../../dashboard/dashboard-page";
import type { Telling } from "../../../host/showing/telling";
import type { News } from "../../../whats-new/news-item";
import { NewsLine } from "../../../whats-new/news-line";
import type { MakePage, ShowPage } from "../view/campaign-pages";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";
import { PageFrame } from "../../views/frames/page-frame";
import { PLAIN_KIT } from "../../views/mount/mount-kit";

export interface HomeNeeds {
  store: CampaignStore;
  characterNotes: CharacterNotes;
  news: News;
  telling: Pick<Telling, "say">;
  actionsFor(show: ShowPage): DashboardActions;
}

export function homeSection(needs: HomeNeeds, syntax: PropertiesSyntax): MakePage {
  return (contentEl, show) => new PageFrame(contentEl, new DashboardPage(needs.store, needs.characterNotes, needs.actionsFor(show), new NewsLine(needs.news, show, needs.telling), syntax), PLAIN_KIT);
}
