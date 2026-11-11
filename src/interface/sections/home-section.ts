import type { CampaignStore } from "../../campaign/campaign-store";
import type { CharacterNotes } from "../../characters/reading/character-notes";
import { DashboardPage, type DashboardActions } from "../../dashboard/dashboard-page";
import type { News } from "../../whats-new/news-item";
import { NewsLine } from "../../whats-new/news-line";
import type { MakePage, ShowPage } from "../view/campaign-pages";

export interface HomeNeeds {
  store: CampaignStore;
  characterNotes: CharacterNotes;
  news: News;
  actionsFor(show: ShowPage): DashboardActions;
}

export function homeSection(needs: HomeNeeds): MakePage {
  return (contentEl, show) =>
    new DashboardPage(contentEl, needs.store, needs.characterNotes, needs.actionsFor(show), (lineEl) => new NewsLine(lineEl, needs.news, show));
}
