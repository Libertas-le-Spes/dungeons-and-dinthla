import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import { NO_CAMPAIGN } from "../../../src/campaign/paths/campaign-folders";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { openAddCoin } from "../../../src/funds/coins/open-add-coin";
import { openNewQuestion } from "../../../src/questions/dialogs/open-new-question";
import { openNewQuest } from "../../../src/quests/dialogs/open-new-quest";
import { Notice, openedModals } from "../../stubs/obsidian";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const noCampaign = { campaignFolder: null } as CampaignStore;

beforeEach(() => {
  Notice.shown = [];
});

describe("a dialog that writes into a session, without a campaign", () => {
  it.each([
    ["Add coin", (app: App) => openAddCoin(app, {} as Gate, noCampaign, vi.fn(), null, STUB_SYNTAX)],
    ["New question", (app: App) => openNewQuestion(app, {} as Gate, noCampaign, vi.fn(), STUB_SYNTAX)],
    ["New quest", (app: App) => openNewQuest(app, {} as Gate, noCampaign, vi.fn(), STUB_SYNTAX)],
  ])("%s says to make a campaign first and opens nothing", (_name, open) => {
    const before = openedModals.length;
    open({} as App);
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals.length).toBe(before);
  });
});
