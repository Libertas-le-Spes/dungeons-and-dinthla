import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import type { Gate } from "../../src/fence/gatekeeper";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { SESSIONS_SHARE_A_NUMBER } from "../../src/campaign/session-to-write";
import { openAddCoin } from "../../src/funds/open-add-coin";
import { openItemDialog } from "../../src/funds/open-item";
import { openNewQuestion } from "../../src/questions/open-new-question";
import { openQuestion } from "../../src/questions/open-question";
import { openNewQuest } from "../../src/quests/open-new-quest";
import { openQuest } from "../../src/quests/open-quest";
import { Notice, openedModals } from "../stubs/obsidian";

const SOURCE = { path: "Pale Moon/Sessions/Session 1.md", line: 0 };

const store = {
  campaignFolder: "Pale Moon",
  current: {
    questions: [{ text: "Who rang the bell", source: SOURCE, clues: [], answer: null }],
    quests: [{ quest: { title: "Mend the bridge" }, source: SOURCE, progress: [], outcome: null }],
    items: [{ name: "Lantern", written: "Lantern", holder: "the party", holderLinked: false, source: SOURCE, history: [{ source: SOURCE }], gone: null }],
    coins: [],
  },
} as unknown as CampaignStore;

function gateWith(paths: string[]): Gate {
  const files = paths.map((path) => ({ path }) as TFile);
  return { files: { getFiles: () => files } } as unknown as Gate;
}

const DIALOGS: [string, string, (app: App, gate: Gate) => void][] = [
  ["Add coin", "Start a session first: coin is written into a session note.", (app, gate) => openAddCoin(app, gate, store, vi.fn(), null)],
  ["New question", "Start a session first: questions are written into a session note.", (app, gate) => openNewQuestion(app, gate, store, vi.fn())],
  ["New quest", "Start a session first: quests are written into a session note.", (app, gate) => openNewQuest(app, gate, store, vi.fn())],
  ["Question", "Start a session first: answers are written into a session note.", (app, gate) => openQuestion(app, gate, store, SOURCE, vi.fn(), vi.fn(), null)],
  ["Quest", "Start a session first: quest changes are written into a session note.", (app, gate) => openQuest(app, gate, store, SOURCE, vi.fn(), vi.fn(), null)],
  ["Item", "Start a session first: item changes are written into a session note.", (app, gate) => openItemDialog(app, gate, store, "Lantern", vi.fn(), vi.fn(), null)],
];

beforeEach(() => {
  Notice.shown = [];
});

describe("a dialog that writes into a session, without a session to write in", () => {
  it.each(DIALOGS)("%s says to start a session first and opens nothing", (_name, noSession, open) => {
    const before = openedModals.length;
    open({} as App, gateWith(["Pale Moon/Pale Moon.md"]));
    expect(Notice.shown).toEqual([noSession]);
    expect(openedModals.length).toBe(before);
  });

  it.each(DIALOGS)("%s says the sessions share a number when two share the latest and opens nothing", (_name, _noSession, open) => {
    const before = openedModals.length;
    open({} as App, gateWith(["Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 01.md"]));
    expect(Notice.shown).toEqual([SESSIONS_SHARE_A_NUMBER]);
    expect(openedModals.length).toBe(before);
  });
});
