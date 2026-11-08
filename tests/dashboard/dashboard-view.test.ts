import { describe, expect, it, vi } from "vitest";
import type { TFile, WorkspaceLeaf } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote, Source } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import type { CharacterNotes } from "../../src/characters/character-notes";
import { DashboardView, type DashboardActions } from "../../src/dashboard/dashboard-view";
import type { CoinOutcome } from "../../src/funds/coin-modal";
import { NO_COIN_ENTRIES } from "../../src/funds/ledger-row";
import { SESSIONS_SHARE_A_NUMBER } from "../../src/campaign/session-to-write";
import { obsidianDocument } from "../views/obsidian-dom";

const CAMPAIGN = "Pale Moon";
const NO_CHARACTERS = "No characters yet. A note in the campaign’s Characters folder adds one.";

function sessionOf(number: number, lines: string[]): SessionNote {
  return { path: `${CAMPAIGN}/Sessions/Session ${number}.md`, number, firstLine: 0, text: lines.join("\n") };
}

function characterFile(name: string): TFile {
  return { path: `${CAMPAIGN}/Characters/${name}.md`, basename: name } as TFile;
}

type Closer = (changed: boolean) => void;

interface Setup {
  folder?: string | null;
  characters?: string[];
  own?: string;
  textOf?: CharacterNotes["textOf"];
}

async function openDashboard(sessions: SessionNote[], { folder = CAMPAIGN, characters = [], own = "", textOf = async () => "" }: Setup = {}) {
  let listener = () => {};
  let noteChanged: (path: string) => void = () => {};
  const unsubscribe = vi.fn();
  const stopWatching = vi.fn();
  const store = {
    current: buildCampaign(sessions),
    sessionNotes: sessions,
    campaignFolder: folder,
    subscribe: (next: () => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const reads = { count: 0 };
  const notes: CharacterNotes = {
    textOf: (file) => {
      reads.count += 1;
      return textOf(file);
    },
    pathOfLink: (linktext) => `${CAMPAIGN}/Characters/${linktext}.md`,
    isOwnCharacter: (file) => file.basename === own,
    campaignFolders: () => [CAMPAIGN],
    filesIn: () => characters.map(characterFile),
    sessionsOf: async () => [],
    onNoteChanged: (changed) => {
      noteChanged = changed;
      return stopWatching;
    },
  };
  const closers: { question: Closer[]; quest: Closer[]; coin: ((outcome: CoinOutcome) => void)[] } = { question: [], quest: [], coin: [] };
  const actions = {
    openRow: vi.fn(),
    openLink: vi.fn(),
    openQuestion: vi.fn((_source: Source, onClosed: Closer) => void closers.question.push(onClosed)),
    openQuest: vi.fn((_source: Source, onClosed: Closer) => void closers.quest.push(onClosed)),
    openLedgerEntry: vi.fn((_source: Source, onClosed: (outcome: CoinOutcome) => void) => void closers.coin.push(onClosed)),
    showQuestions: vi.fn(),
    showQuests: vi.fn(),
    showFunds: vi.fn(),
    showCharacters: vi.fn(),
    startSession: vi.fn(),
    sessionHeadingOf: (path: string) => `${path.slice(path.lastIndexOf("/") + 1, -3)} · The ferry at dusk`,
  } satisfies DashboardActions;
  const view = new DashboardView({} as WorkspaceLeaf, store as unknown as CampaignStore, notes, actions);
  const root = obsidianDocument().createElement("div");
  root.ownerDocument.body.append(root);
  view.contentEl = root;
  const registered: (() => void)[] = [];
  view.register = (callback) => {
    registered.push(callback);
  };
  await view.onOpen();
  const change = (next: SessionNote[]) => {
    store.current = buildCampaign(next);
    store.sessionNotes = next;
    listener();
  };
  const close = () => {
    for (const callback of registered) callback();
  };
  return { root, actions, closers, reads, change, close, unsubscribe, stopWatching, noteChanged: (path: string) => noteChanged(path) };
}

function panel(root: HTMLElement, index: number): HTMLElement {
  return root.querySelectorAll<HTMLElement>(".dd-panel")[index]!;
}

function textsOf(root: HTMLElement, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

function button(root: HTMLElement, text: string): HTMLElement {
  return Array.from(root.querySelectorAll<HTMLElement>("button")).find((element) => element.textContent === text)!;
}

function focusedLine(root: HTMLElement): string | undefined {
  return (root.ownerDocument.activeElement as HTMLElement).dataset.line;
}

const QUESTIONS = 0;
const QUESTS = 1;
const PURSE = 2;
const CHARACTERS = 3;
const SESSION = 4;

describe("DashboardView", () => {
  it("counts the open questions and shows the newest three, as the Questions view does", async () => {
    const { root } = await openDashboard([sessionOf(1, ["? First", "? Second", "? Third", "? Fourth", "? Fifth", "?= Fifth: done"])]);
    const questions = panel(root, QUESTIONS);
    expect(textsOf(questions, ".dd-title")).toEqual(["Open questions"]);
    expect(textsOf(questions, ".dd-big")).toEqual(["4open"]);
    expect(textsOf(questions, ".dd-text")).toEqual(["Fourth", "Third", "Second"]);
  });

  it("counts the active quests and shows the newest three, as the Quests view does", async () => {
    const { root } = await openDashboard([sessionOf(1, ["! Find it, from: [[Vess]]", "! Guard it", "! Burn it", "! Keep it", "!x Keep it: lost", "! Bury it"])]);
    const quests = panel(root, QUESTS);
    expect(textsOf(quests, ".dd-big")).toEqual(["4active"]);
    expect(textsOf(quests, ".dd-text")).toEqual(["Bury it", "Burn it", "Guard it"]);
  });

  it("shows the purse, the items held, money in and out, and the three latest entries", async () => {
    const lines = ["$ +50 gp advance", "$ Paid 2 gp for rooms", "$ 35 gp 4 sp from the bandits", "$ 1 gp found", "$ Potion of healing", "$ [[Mira]] Rope"];
    const { root } = await openDashboard([sessionOf(1, lines)]);
    const purse = panel(root, PURSE);
    expect(textsOf(purse, ".dd-big")).toEqual(["84 gp 4 sp+ 2 items"]);
    expect(textsOf(purse, ".dd-in-out > span")).toEqual(["In 86 gp 4 sp", "Out 2 gp"]);
    expect(textsOf(purse, ".dd-ledger .dd-what")).toEqual(["1 gp found", "35 gp 4 sp from the bandits", "Paid 2 gp for rooms"]);
    expect(textsOf(purse, ".dd-ledger .dd-amount")).toEqual(["+1 gp", "+35 gp 4 sp", "−2 gp"]);
    expect(purse.querySelector(".dd-empty")).toBeNull();
  });

  it("says one item, and nothing about items when none is held", async () => {
    expect(textsOf(panel((await openDashboard([sessionOf(1, ["$ 5 gp found", "$ Rope"])])).root, PURSE), ".dd-big")).toEqual(["5 gp+ 1 item"]);
    expect(textsOf(panel((await openDashboard([sessionOf(1, ["$ 5 gp found"])])).root, PURSE), ".dd-big")).toEqual(["5 gp"]);
  });

  it("says when there is nothing to show yet", async () => {
    const { root } = await openDashboard([]);
    expect(textsOf(panel(root, QUESTIONS), ".dd-big")).toEqual(["Nothing open"]);
    expect(textsOf(panel(root, QUESTS), ".dd-big")).toEqual(["No active quests"]);
    expect(textsOf(panel(root, PURSE), ".dd-ledger .dd-empty")).toEqual([NO_COIN_ENTRIES]);
    await vi.waitFor(() => expect(textsOf(panel(root, CHARACTERS), ".dd-empty")).toEqual([NO_CHARACTERS]));
    expect(textsOf(panel(root, SESSION), ".dd-title")).toEqual(["Latest session"]);
    expect(textsOf(panel(root, SESSION), ".dd-empty")).toEqual(["No sessions yet. Start one to write in it."]);
  });

  it("heads the latest session panel with its title and shows the four lines written last in it", async () => {
    const earlier = sessionOf(1, ["? Who sent the letter"]);
    const latest = sessionOf(2, ["? Why does the wheel turn", "! Find the caravan", "$ 5 gp found", "notes", "?= Who sent the letter: Vess", "? Who is she", "! Escort Mira"]);
    const { root } = await openDashboard([latest, earlier]);
    const session = panel(root, SESSION);
    expect(textsOf(session, ".dd-title")).toEqual(["Session 2 · The ferry at dusk"]);
    expect(textsOf(session, ".dd-big")).toEqual(["5lines"]);
    expect(textsOf(session, ".dd-text, .dd-what")).toEqual(["Escort Mira", "Who is she", "5 gp found", "Find the caravan"]);
  });

  it("says one line, and when nothing is written in the latest session yet", async () => {
    expect(textsOf(panel((await openDashboard([sessionOf(1, ["? Who"])])).root, SESSION), ".dd-big")).toEqual(["1line"]);
    expect(textsOf(panel((await openDashboard([sessionOf(1, ["notes"])])).root, SESSION), ".dd-big")).toEqual(["Nothing written yet"]);
  });

  it("shows no latest session, and says why, when two session notes share the highest number", async () => {
    const tied = { ...sessionOf(2, ["? Who"]), path: `${CAMPAIGN}/Sessions/Session 02.md` };
    const { root } = await openDashboard([sessionOf(1, []), sessionOf(2, []), tied]);
    const session = panel(root, SESSION);
    expect(textsOf(session, ".dd-title")).toEqual(["Latest session"]);
    expect(textsOf(session, ".dd-empty")).toEqual([SESSIONS_SHARE_A_NUMBER]);
    expect(button(session, "Write notes").hidden).toBe(true);
  });

  it("shows no latest session without a campaign", async () => {
    const { root } = await openDashboard([sessionOf(1, ["? Who"])], { folder: null });
    expect(textsOf(panel(root, SESSION), ".dd-empty")).toEqual(["No sessions yet. Start one to write in it."]);
  });

  it("opens the latest session to write in it, and has nothing to open without one", async () => {
    const { root, actions, change } = await openDashboard([]);
    const write = button(panel(root, SESSION), "Write notes");
    expect(write.hidden).toBe(true);
    write.click();
    expect(actions.openRow).not.toHaveBeenCalled();
    change([sessionOf(3, []), sessionOf(4, [])]);
    expect(write.hidden).toBe(false);
    write.click();
    expect(actions.openRow).toHaveBeenCalledWith({ path: `${CAMPAIGN}/Sessions/Session 4.md`, line: 0 });
    change([]);
    write.click();
    expect(actions.openRow).toHaveBeenCalledOnce();
  });

  it("opens each panel's full view and starts a new session", async () => {
    const { root, actions } = await openDashboard([]);
    button(root, "All questions").click();
    button(root, "All quests").click();
    button(root, "Party funds").click();
    button(root, "All characters").click();
    button(root, "New session").click();
    expect(actions.showQuestions).toHaveBeenCalledOnce();
    expect(actions.showQuests).toHaveBeenCalledOnce();
    expect(actions.showFunds).toHaveBeenCalledOnce();
    expect(actions.showCharacters).toHaveBeenCalledOnce();
    expect(actions.startSession).toHaveBeenCalledOnce();
  });

  it("opens a question's or a quest's dialog from its row and puts focus back on it", async () => {
    const { root, actions, closers } = await openDashboard([sessionOf(1, ["! Find it", "? Who"])]);
    const source = { path: `${CAMPAIGN}/Sessions/Session 1.md`, line: 1 };
    panel(root, QUESTIONS).querySelector<HTMLElement>(".dd-row")!.click();
    expect(actions.openQuestion).toHaveBeenCalledWith(source, expect.any(Function));
    closers.question[0]!(false);
    expect(root.ownerDocument.activeElement!.closest(".dd-panel")).toBe(panel(root, QUESTIONS));
    panel(root, QUESTS).querySelector<HTMLElement>(".dd-row")!.click();
    expect(actions.openQuest).toHaveBeenCalledWith({ ...source, line: 0 }, expect.any(Function));
    closers.quest[0]!(false);
    expect(root.ownerDocument.activeElement!.closest(".dd-panel")).toBe(panel(root, QUESTS));
  });

  it("puts focus back on the row in the panel it was tapped in, once the dashboard has redrawn", async () => {
    const lines = ["? Who"];
    const { root, closers, change } = await openDashboard([sessionOf(1, lines)]);
    panel(root, SESSION).querySelector<HTMLElement>(".dd-row")!.click();
    closers.question[0]!(true);
    change([sessionOf(1, [...lines, "?+ Who: a clue"])]);
    expect(root.ownerDocument.activeElement!.closest(".dd-panel")).toBe(panel(root, SESSION));
    expect(focusedLine(root)).toBe("0");
  });

  it("puts focus on the panel's link when the row is gone after a change", async () => {
    const { root, closers, change } = await openDashboard([sessionOf(1, ["? Who"])]);
    panel(root, QUESTIONS).querySelector<HTMLElement>(".dd-row")!.click();
    closers.question[0]!(true);
    change([sessionOf(1, [])]);
    expect(root.ownerDocument.activeElement).toBe(button(panel(root, QUESTIONS), "All questions"));
  });

  it("opens a coin entry from the ledger and puts focus back, or on the panel's link once it is deleted", async () => {
    const { root, actions, closers, change } = await openDashboard([sessionOf(1, ["$ 5 gp found"])]);
    const row = () => panel(root, PURSE).querySelector<HTMLElement>(".dd-row")!;
    row().click();
    expect(actions.openLedgerEntry).toHaveBeenCalledWith({ path: `${CAMPAIGN}/Sessions/Session 1.md`, line: 0 }, expect.any(Function));
    closers.coin[0]!("unchanged");
    expect(root.ownerDocument.activeElement).toBe(row());
  });

  it("puts focus on the panel's link once a coin entry is deleted, not on the entry that moves up to its line", async () => {
    const lines = ["$ 1 gp found", "$ 5 gp found"];
    const { root, closers, change } = await openDashboard([sessionOf(1, lines)]);
    const rows = panel(root, PURSE).querySelectorAll<HTMLElement>(".dd-row");
    expect(rows[1]!.dataset.line).toBe("0");
    rows[1]!.click();
    closers.coin[0]!("deleted");
    change([sessionOf(1, ["$ 5 gp found"])]);
    expect(root.ownerDocument.activeElement).toBe(button(panel(root, PURSE), "Party funds"));
  });

  it("puts focus back on a coin entry once the dashboard has redrawn after a change", async () => {
    const { root, closers, change } = await openDashboard([sessionOf(1, ["$ 5 gp found"])]);
    panel(root, PURSE).querySelector<HTMLElement>(".dd-row")!.click();
    closers.coin[0]!("written");
    change([sessionOf(1, ["$ 6 gp found"])]);
    expect(focusedLine(root)).toBe("0");
    expect(root.ownerDocument.activeElement!.closest(".dd-panel")).toBe(panel(root, PURSE));
  });

  it("leaves focus alone on a later redraw when a coin entry closed unchanged", async () => {
    const { root, closers, change } = await openDashboard([sessionOf(1, ["$ 5 gp found"])]);
    panel(root, PURSE).querySelector<HTMLElement>(".dd-row")!.click();
    closers.coin[0]!("unchanged");
    const editor = root.ownerDocument.createElement("input");
    root.ownerDocument.body.append(editor);
    editor.focus();
    change([sessionOf(1, ["$ 5 gp found", "$ 1 gp found"])]);
    expect(root.ownerDocument.activeElement).toBe(editor);
  });

  it("opens a coin entry written in the latest session from its panel too", async () => {
    const { root, actions } = await openDashboard([sessionOf(1, ["$ 5 gp found"])]);
    panel(root, SESSION).querySelector<HTMLElement>(".dd-row")!.click();
    expect(actions.openLedgerEntry).toHaveBeenCalledOnce();
  });

  it("shows each character's class, AC and HP, marks the player's own, and opens their note", async () => {
    const sessions = [sessionOf(1, ["[[Mira]] class: rogue, AC: 15", "[[Thessaly]] HP: 22"])];
    const { root, actions } = await openDashboard(sessions, { characters: ["Mira", "Thessaly"], own: "Thessaly" });
    const characters = panel(root, CHARACTERS);
    await vi.waitFor(() => expect(textsOf(characters, ".dd-card-name")).toEqual(["Mira", "Thessaly"]));
    expect(textsOf(characters, ".dd-card-line")).toEqual(["Class rogue · AC 15 · HP ?", "Class ? · AC ? · HP 22"]);
    expect(textsOf(characters, ".dd-card-own-label")).toEqual(["Your character"]);
    expect(characters.querySelector(".dd-empty")).toBeNull();
    characters.querySelector<HTMLElement>(".dd-card")!.click();
    expect(actions.openRow).toHaveBeenCalledWith({ path: `${CAMPAIGN}/Characters/Mira.md`, line: 0 });
  });

  it("shows no characters without a campaign", async () => {
    const { root } = await openDashboard([], { folder: null, characters: ["Mira"] });
    await vi.waitFor(() => expect(textsOf(panel(root, CHARACTERS), ".dd-empty")).toEqual([NO_CHARACTERS]));
  });

  it("redraws the characters when a character note or the campaign note changes, and not for other notes", async () => {
    const { root, reads, noteChanged } = await openDashboard([], { characters: ["Mira"] });
    await vi.waitFor(() => expect(textsOf(root, ".dd-card-name")).toEqual(["Mira"]));
    const before = reads.count;
    noteChanged(`${CAMPAIGN}/Sessions/Session 1.md`);
    noteChanged(`Ashen Road/Characters/Mira.md`);
    expect(reads.count).toBe(before);
    noteChanged(`${CAMPAIGN}/Characters/Mira.md`);
    expect(reads.count).toBe(before + 1);
    noteChanged(`${CAMPAIGN}/${CAMPAIGN}.md`);
    expect(reads.count).toBe(before + 2);
  });

  it("watches no notes for characters without a campaign", async () => {
    const { reads, noteChanged } = await openDashboard([], { folder: null });
    noteChanged("null/Characters/Mira.md");
    expect(reads.count).toBe(0);
  });

  it("keeps the newest characters when an earlier read finishes last", async () => {
    let finishFirst: (text: string) => void = () => {};
    let calls = 0;
    const textOf = () => {
      calls += 1;
      if (calls === 1) return new Promise<string>((resolve) => (finishFirst = resolve));
      return Promise.resolve("AC: 18");
    };
    const { root, change } = await openDashboard([], { characters: ["Mira"], textOf });
    change([]);
    await vi.waitFor(() => expect(textsOf(root, ".dd-card-line")).toEqual(["Class ? · AC 18 · HP ?"]));
    finishFirst("AC: 12");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(textsOf(root, ".dd-card-line")).toEqual(["Class ? · AC 18 · HP ?"]);
  });

  it("stops listening when the view closes", async () => {
    const { close, unsubscribe, stopWatching } = await openDashboard([]);
    close();
    expect(unsubscribe).toHaveBeenCalled();
    expect(stopWatching).toHaveBeenCalled();
  });
});
