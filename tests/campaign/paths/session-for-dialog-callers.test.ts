import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { SESSIONS_SHARE_A_NUMBER } from "../../../src/campaign/paths/session-to-write";
import { openAddCoin } from "../../../src/funds/coins/open-add-coin";
import { openItemDialog } from "../../../src/funds/items/open-item";
import { openNewQuestion } from "../../../src/questions/dialogs/open-new-question";
import { openQuestion } from "../../../src/questions/dialogs/open-question";
import { openNewQuest } from "../../../src/quests/dialogs/open-new-quest";
import { openQuest } from "../../../src/quests/dialogs/open-quest";
import { Notice, openedModals } from "../../stubs/obsidian";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const THREE = "Pale Moon/Sessions/Session 3.md";

function storeRaisedIn(path: string): CampaignStore {
  const source = { path, line: 0 };
  return {
    campaignFolder: "Pale Moon",
    sessionNotes: [],
    current: {
      questions: [{ text: "Who rang the bell", source, clues: [], answer: null }],
      quests: [{ quest: { title: "Mend the bridge" }, source, progress: [], outcome: null }],
      items: [{ name: "Lantern", written: "Lantern", holder: "the party", holderLinked: false, source, history: [{ source }], gone: null }],
      coins: [],
    },
  } as unknown as CampaignStore;
}

function gateWith(paths: string[]): Gate {
  const files = paths.map((path) => ({ path }) as TFile);
  return { files: { getFiles: () => files, getMarkdownFiles: () => files } } as unknown as Gate;
}

type Open = (gate: Gate, store: CampaignStore, openNote: () => void, activePath: string | null) => void;

const app = {} as App;
function raisedSource(store: CampaignStore): { path: string; line: number } {
  return store.current.questions[0]!.source;
}

const REFUSING: [string, string, Open][] = [
  ["Add coin", "Start a session first: coin is written into a session note.", (gate, store, _openNote, activePath) => openAddCoin(app, gate, store, vi.fn(), activePath)],
  ["New question", "Start a session first: questions are written into a session note.", (gate, store) => openNewQuestion(app, gate, store, vi.fn())],
  ["New quest", "Start a session first: quests are written into a session note.", (gate, store) => openNewQuest(app, gate, store, vi.fn())],
  ["Question", "Start a session first: answers are written into a session note.", (gate, store, openNote, activePath) => openQuestion(app, gate, store, raisedSource(store), openNote, vi.fn(), activePath)],
  ["Quest", "Start a session first: quest changes are written into a session note.", (gate, store, openNote, activePath) => openQuest(app, gate, store, raisedSource(store), openNote, vi.fn(), activePath)],
  ["Item", "Start a session first: item changes are written into a session note.", (gate, store, openNote, activePath) => openItemDialog(app, gate, store, "Lantern", openNote, vi.fn(), activePath)],
];

const ADD_COIN: [string, string, Open] = ["Add coin", "Adds a line to", (gate, store, _openNote, activePath) => openAddCoin(app, gate, store, vi.fn(), activePath)];
const QUESTION: [string, string, Open] = ["Question", "New lines go into", (gate, store, openNote, activePath) => openQuestion(app, gate, store, raisedSource(store), openNote, vi.fn(), activePath)];
const QUEST: [string, string, Open] = ["Quest", "New lines go into", (gate, store, openNote, activePath) => openQuest(app, gate, store, raisedSource(store), openNote, vi.fn(), activePath)];
const ITEM: [string, string, Open] = ["Item", "New lines go into", (gate, store, openNote, activePath) => openItemDialog(app, gate, store, "Lantern", openNote, vi.fn(), activePath)];

const FINDING = [ADD_COIN, QUESTION, QUEST, ITEM];
const RAISED_IN = [QUESTION, QUEST, ITEM];

function whereOfLastModal(): string | null {
  const modal = openedModals[openedModals.length - 1] as unknown as { contentEl: HTMLElement };
  const where = modal.contentEl.querySelector(".dd-where");
  if (where === null) return null;
  return where.textContent;
}

beforeEach(() => {
  Notice.shown = [];
});

describe("a dialog that writes into a session, without a session to write in", () => {
  it.each(REFUSING)("%s says to start a session first and opens nothing", (_name, noSession, open) => {
    const before = openedModals.length;
    const openNote = vi.fn();
    open(gateWith(["Pale Moon/Pale Moon.md"]), storeRaisedIn(ONE), openNote, null);
    expect(Notice.shown).toEqual([noSession]);
    expect(openedModals.length).toBe(before);
    expect(openNote).not.toHaveBeenCalled();
  });

  it.each(REFUSING)("%s says the sessions share a number when two share the latest and opens nothing", (_name, _noSession, open) => {
    const before = openedModals.length;
    const openNote = vi.fn();
    open(gateWith([ONE, "Pale Moon/Sessions/Session 01.md"]), storeRaisedIn(ONE), openNote, null);
    expect(Notice.shown).toEqual([SESSIONS_SHARE_A_NUMBER]);
    expect(openedModals.length).toBe(before);
    expect(openNote).not.toHaveBeenCalled();
  });
});

describe("a dialog that writes into a session, with sessions to write in", () => {
  it.each(FINDING)("%s writes in the open session when it isn't the latest", (_name, where, open) => {
    const before = openedModals.length;
    open(gateWith([ONE, TWO, THREE]), storeRaisedIn(ONE), vi.fn(), TWO);
    expect(openedModals.length).toBe(before + 1);
    expect(whereOfLastModal()).toBe(`${where} Session 2.`);
  });

  it.each(RAISED_IN)("%s writes in the latest session when the open one is earlier than the record's", (_name, where, open) => {
    const before = openedModals.length;
    open(gateWith([ONE, TWO, THREE]), storeRaisedIn(TWO), vi.fn(), ONE);
    expect(openedModals.length).toBe(before + 1);
    expect(whereOfLastModal()).toBe(`${where} Session 3.`);
  });
});
