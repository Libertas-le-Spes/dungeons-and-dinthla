import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { NO_CAMPAIGN } from "../../src/campaign/campaign-folders";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { openAddCoin } from "../../src/funds/open-add-coin";
import { openNewQuestion } from "../../src/questions/open-new-question";
import { openNewQuest } from "../../src/quests/open-new-quest";
import { Notice, openedModals } from "../stubs/obsidian";

const noCampaign = { campaignFolder: null } as CampaignStore;

beforeEach(() => {
  Notice.shown = [];
});

describe("a dialog that writes into a session, without a campaign", () => {
  it.each([
    ["Add coin", (app: App) => openAddCoin(app, noCampaign, vi.fn())],
    ["New question", (app: App) => openNewQuestion(app, noCampaign, vi.fn())],
    ["New quest", (app: App) => openNewQuest(app, noCampaign, vi.fn())],
  ])("%s says to make a campaign first and opens nothing", (_name, open) => {
    const before = openedModals.length;
    open({} as App);
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals.length).toBe(before);
  });
});
