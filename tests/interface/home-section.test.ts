import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import type { CharacterNotes } from "../../src/characters/reading/character-notes";
import type { DashboardActions } from "../../src/dashboard/dashboard-page";
import { homeSection } from "../../src/interface/home-section";
import type { News } from "../../src/whats-new/news-item";
import { obsidianDocument } from "../views/obsidian-dom";

function made() {
  const store = { campaignFolder: "Silver Road", sessionNotes: [], current: buildCampaign([]), subscribe: () => () => {} };
  const characterNotes = { filesIn: () => [], onNoteChanged: () => () => {} } as unknown as CharacterNotes;
  const news: News = { latest: () => ({ sentence: "Lanterns now light the party funds.", page: "funds" }), seen: vi.fn(async () => {}) };
  const actionsFor = vi.fn(() => ({ startSession: vi.fn() }) as unknown as DashboardActions);
  const root = obsidianDocument().body.createDiv();
  const show = vi.fn();
  const page = homeSection({ store: store as unknown as CampaignStore, characterNotes, news, actionsFor })(root, show, null, vi.fn());
  page.load();
  return { root, show, actionsFor };
}

describe("homeSection", () => {
  it("opens the page the news is about with Show me on the dashboard's news line", () => {
    const { root, show } = made();
    const showMe = Array.from(root.querySelectorAll(".dd-news button")).find((button) => button.textContent === "Show me") as HTMLElement;
    showMe.click();
    expect(show).toHaveBeenCalledExactlyOnceWith({ page: "funds", path: null });
  });

  it("gives the dashboard its actions for this tab", () => {
    const { show, actionsFor } = made();
    expect(actionsFor).toHaveBeenCalledExactlyOnceWith(show);
  });
});
