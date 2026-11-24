import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { NO_CAMPAIGN } from "../../../src/campaign/paths/campaign-folders";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { openAddCoin } from "../../../src/funds/coins/open-add-coin";
import { openNewQuestion } from "../../../src/questions/dialogs/open-new-question";
import { openNewQuest, type NewQuestNotes } from "../../../src/quests/dialogs/open-new-quest";
import { Notice, openedModals } from "../../stubs/obsidian";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";
import type { NoteStore } from "../../../src/host/notes/note-store";
import type { CoinNotes } from "../../../src/funds/coins/open-add-coin";
import { PARTY_SIDE } from "../../../src/funds/coins/coin-sides";

const noCampaign = { campaignFolder: null } as CampaignStore;

beforeEach(() => {
  Notice.shown = [];
});

describe("a dialog that writes into a session, without a campaign", () => {
  it.each([
    ["Add coin", (app: App) => openAddCoin({ showing: OBSIDIAN_SHOWING, notes: {} as CoinNotes, links: { linkTextTo: vi.fn() }, store: noCampaign, syntax: STUB_SYNTAX }, PARTY_SIDE, vi.fn(), null)],
    ["New question", (app: App) => openNewQuestion(OBSIDIAN_SHOWING, {} as NoteStore, noCampaign, vi.fn(), STUB_SYNTAX)],
    ["New quest", (app: App) => openNewQuest(OBSIDIAN_SHOWING, {} as NewQuestNotes, noCampaign, vi.fn(), STUB_SYNTAX)],
  ])("%s says to make a campaign first and opens nothing", (_name, open) => {
    const before = openedModals.length;
    open({} as App);
    expect(Notice.shown).toEqual([NO_CAMPAIGN]);
    expect(openedModals.length).toBe(before);
  });
});
