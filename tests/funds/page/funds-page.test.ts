import { describe, expect, it, vi } from "vitest";
import { Component } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, Source } from "../../../src/campaign/record/campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { CoinOutcome } from "../../../src/funds/coins/coin-modal";
import { FundsPage, type ShownItem } from "../../../src/funds/page/funds-page";
import type { OwnSheet } from "../../../src/funds/purses/own-characters";
import { HeldCalls } from "../../stubs/held-calls";
import { obsidianDocument } from "../../stubs/obsidian-dom";

function campaignOf(lines: string[], ...laterSessions: string[][]): Campaign {
  return buildCampaign(
    [lines, ...laterSessions].map((sessionLines, index) => ({
      path: `Pale Moon/Sessions/Session ${index + 1}.md`,
      number: index + 1,
      firstLine: 0,
      text: sessionLines.join("\n"),
    })),
  );
}

type OpenLedgerEntry = (source: Source, onClosed: (outcome: CoinOutcome) => void) => void;
type OpenItem = (name: string, source: Source, onClosed: (changed: boolean) => void) => void;

interface PageParts {
  campaign: Campaign;
  noteNames: string[];
  addCoin: ((returnFocus: () => void) => void) | null;
  openLedgerEntry: OpenLedgerEntry | null;
  openItem: OpenItem | null;
  shownItem: ShownItem | null;
  ownNames: string[];
  sheets?: OwnSheet[];
}

const PARTY_PANEL = '[role="tabpanel"][id$="-panel-1"]';
const MINE_PANEL = '[role="tabpanel"][id$="-panel-0"]';

class MadeUpOwnCharacters {
  listener: () => void = () => {};
  listening = false;
  known: OwnSheet[] | null = null;
  reads = 0;

  constructor(public names: () => string[]) {}

  async sheets(): Promise<OwnSheet[]> {
    this.reads += 1;
    if (this.known !== null) return this.known;
    return this.names().map((name) => ({ name, purse: null, importedSession: null }));
  }

  subscribe(changed: () => void): () => void {
    this.listener = changed;
    this.listening = true;
    return () => {
      this.listening = false;
    };
  }
}

async function openPage({ campaign, noteNames, addCoin, openLedgerEntry, openItem, shownItem, ownNames, sheets }: PageParts) {
  let listener: (campaign: Campaign) => void = () => {};
  const unsubscribe = vi.fn();
  const store = {
    current: campaign,
    subscribe: (next: (campaign: Campaign) => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  const noteExists = (name: string) => noteNames.includes(name);
  const root = obsidianDocument().createElement("div");
  const owners = new MadeUpOwnCharacters(() => ownNames);
  if (sheets !== undefined) owners.known = sheets;
  const view = new FundsPage({
    contentEl: root,
    store: store as unknown as CampaignStore,
    actions,
    noteExists,
    addCoin,
    openLedgerEntry,
    openItem,
    shownItem,
    ownCharacters: owners,
  });
  view.load();
  await view.rendered();
  const change = (next: Campaign) => {
    store.current = next;
    listener(next);
  };
  const close = () => view.unload();
  return { root, actions, change, close, unsubscribe, owners, view };
}

function elementIn(root: HTMLElement, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}.`);
  return found;
}

function textsOf(root: HTMLElement, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

describe("FundsPage", () => {
  it("shows the purse, money in and out, and the ledger newest first with each balance", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ +50 gp advance", "$ Paid 2 gp for rooms", "$ 35 gp 4 sp from the bandits"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["83 gp 4 sp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-in-out > span`)).toEqual(["In 85 gp 4 sp", "Out 2 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-amount`)).toEqual(["+35 gp 4 sp", "−2 gp", "+50 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-direction`)).toEqual(["In", "Out", "In"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-balance`)).toEqual(["83 gp 4 sp", "48 gp", "50 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-what`)).toEqual(["35 gp 4 sp from the bandits", "Paid 2 gp for rooms", "+50 gp advance"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual(["3 entries"]);
  });

  it("shows the coins the purse is made of when they read differently from it", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 1 pp found", "$ 5 gp found"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-coin`)).toEqual(["1 pp", "5 gp"]);
  });

  it("leaves the coins out when they read the same as the purse", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 35 gp 4 sp found"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(root.querySelector(`${PARTY_PANEL} .dd-coin`)).toBeNull();
  });

  it("says no coin yet when there is none", async () => {
    const { root } = await openPage({ campaign: campaignOf([]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-coins .dd-empty`)).toEqual(["No coin yet. Try “$ 20 gp”."]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-empty`)).toEqual(["No coin entries yet."]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["0 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual([""]);
  });

  it("counts one entry as an entry", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 5 gp"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual(["1 entry"]);
  });

  it("writes large coin counts as the purse does, so they aren't shown twice", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 1200 gp from the dragon"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["1,200 gp"]);
    expect(root.querySelector(`${PARTY_PANEL} .dd-coin`)).toBeNull();
  });

  it("labels the coins the purse is made of", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 1 pp found", "$ 5 gp found"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-coins-label`)).toEqual(["In coins:"]);
  });

  it("redraws when notes change, and stops listening when closed", async () => {
    const { root, change, close, unsubscribe } = await openPage({ campaign: campaignOf([]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    change(campaignOf(["$ 5 gp found"]));
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["5 gp"]);
    close();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("opens the session at a ledger line when it is tapped", async () => {
    const { root, actions } = await openPage({ campaign: campaignOf(["We rode on.", "$ 5 gp"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    (root.querySelector(`${PARTY_PANEL} .dd-ledger-row`) as HTMLElement).click();
    expect(actions.openRow).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 });
  });

  it("writes an entry that comes to nothing without a sign", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ found 5 gp, paid 5 gp toll"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-amount`)).toEqual(["0 gp"]);
  });

  it("shows an item's name without the note's escapes, as the note reads", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ [[Primary Monk]] Rope (50 ft) \\*silk\\*"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-scroll-list > .dd-list .dd-text`)).toEqual(["Rope (50 ft) *silk*"]);
  });

  it("shows a name typed at the table as written, backslashes and all, when the import wouldn't have written it so", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ [[Primary Monk]] \\o/ banner"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-scroll-list > .dd-list .dd-text`)).toEqual(["\\o/ banner"]);
  });

  it("lists held items under their holders, the party's own last, with gone items folded away", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ [[Mira]] Flame Tongue", "$ Potion of healing", "$ Spyglass", "$ Rope"], ["$$ Spyglass :sold 20 gp", "$$ Rope :used"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-items-panel .dd-holder`)).toEqual(["Mira", "The party"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-scroll-list > .dd-list .dd-text`)).toEqual(["Flame Tongue", "Potion of healing"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-scroll-list > .dd-list .dd-mark-ledger`)).toEqual(["$", "$"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-items-panel .dd-title .dd-count`)).toEqual(["2 held"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-items-panel .dd-folded summary`)).toEqual(["Gone2"]);
    expect(root.querySelectorAll(".dd-folded .dd-text.dd-gone")).toHaveLength(2);
  });

  it("says how and in which session each item went, and when its sale is in the ledger", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ Spyglass", "$ Rope", "$ Map"], ["$$ Spyglass :sold 20 gp", "$$ Map :sold", "$$ Rope :used"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-folded .dd-meta`)).toEqual([
      "Used up · Session 2",
      "Sold · Session 2",
      "Sold · sale in the ledger · Session 2",
    ]);
    expect(Array.from(root.querySelectorAll(".dd-folded .dd-mark-gone")).map((mark) => mark.getAttribute("aria-label"))).toEqual([
      "Used up",
      "Sold",
      "Sold",
    ]);
  });

  it("opens a held item where it was written, and a gone one where it went", async () => {
    const { root, actions } = await openPage({ campaign: campaignOf(["$ Potion of healing", "$ Rope"], ["We rode on.", "$$ Rope :used"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    elementIn(root, `${PARTY_PANEL} .dd-scroll-list > .dd-list .dd-row`).click();
    expect(actions.openRow).toHaveBeenLastCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 0 });
    elementIn(root, `${PARTY_PANEL} .dd-folded .dd-row`).click();
    expect(actions.openRow).toHaveBeenLastCalledWith({ path: "Pale Moon/Sessions/Session 2.md", line: 1 });
  });

  it("says no items yet, and that nothing is gone, when there are none", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 5 gp"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-scroll-list > .dd-empty`)).toEqual([
      "No items yet. Try “$ Rope”.",
    ]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-folded .dd-empty`)).toEqual(["Nothing sold, used or lost yet."]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-items-panel .dd-title .dd-count`)).toEqual([""]);
  });

  it("opens a holder's note when their name is tapped", async () => {
    const { root, actions } = await openPage({ campaign: campaignOf(["$ [[Mira]] Flame Tongue"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    elementIn(root, `${PARTY_PANEL} .dd-holder a.dd-link-name`).click();
    expect(actions.openLink).toHaveBeenCalledWith("Mira", "Pale Moon/Sessions/Session 1.md", false);
  });

  it("names a holder without a note in plain text, with no link", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ Rope", "$$ Rope :changed to Bob the innkeeper"]), noteNames: [], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-holder`)).toEqual(["Bob the innkeeper"]);
    expect(root.querySelector(`${PARTY_PANEL} .dd-holder a`)).toBeNull();
  });

  it("offers Add coin on the ledger when coin can be added, handing it a way back", async () => {
    expect((await openPage({ campaign: campaignOf([]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] })).root.querySelector(`${PARTY_PANEL} .dd-ledger-panel .dd-create`)).toBeNull();
    const addCoin = vi.fn();
    const { root, change } = await openPage({ campaign: campaignOf([]), noteNames: [], addCoin, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    root.ownerDocument.body.append(root);
    const button = root.querySelector(`${PARTY_PANEL} .dd-ledger-panel .dd-create`) as HTMLElement;
    expect(button.textContent).toBe("Add coin");
    button.click();
    expect(addCoin).toHaveBeenCalledTimes(1);
    change(campaignOf(["$ 5 gp found"]));
    addCoin.mock.calls[0]![0]();
    expect(root.ownerDocument.activeElement).toBe(button);
    expect(root.querySelector(`${PARTY_PANEL} .dd-ledger-panel .dd-count`)?.textContent).toBe("1 entry");
  });

  it("opens a ledger entry to change it, and puts focus back on that entry after the redraw", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const lines = ["$ 5 gp found", "$ 2 gp tip", "$ 7 gp later"];
    const { root, change } = await openPage({ campaign: campaignOf(lines), noteNames: [], addCoin: vi.fn(), openLedgerEntry, openItem: null, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    const rowAt = (line: number) => root.querySelector(`${PARTY_PANEL} .dd-ledger-row[data-line="${line}"]`) as HTMLElement;
    rowAt(1).click();
    expect(openLedgerEntry).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 }, expect.any(Function));
    openLedgerEntry.mock.calls[0]![1]("written");
    change(campaignOf(["$ 5 gp found", "$ 3 gp tip", "$ 7 gp later"]));
    expect(document.activeElement).toBe(rowAt(1));
    expect(rowAt(1).querySelector(".dd-what")?.textContent).toBe("3 gp tip");
  });

  it("leaves focus alone on a later redraw when an entry closed unchanged", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const { root, change } = await openPage({ campaign: campaignOf(["$ 5 gp found"]), noteNames: [], addCoin: vi.fn(), openLedgerEntry, openItem: null, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    (root.querySelector(`${PARTY_PANEL} .dd-ledger-row`) as HTMLElement).click();
    openLedgerEntry.mock.calls[0]![1]("unchanged");
    const editor = document.createElement("input");
    document.body.append(editor);
    editor.focus();
    change(campaignOf(["$ 5 gp found", "$ 1 gp found"]));
    expect(document.activeElement).toBe(editor);
  });

  it("puts focus on Add coin after an entry is deleted, and back on the row when nothing changed", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const { root, change } = await openPage({ campaign: campaignOf(["$ 5 gp found", "$ 2 gp tip"]), noteNames: [], addCoin: vi.fn(), openLedgerEntry, openItem: null, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    const rowAt = (line: number) => root.querySelector(`${PARTY_PANEL} .dd-ledger-row[data-line="${line}"]`) as HTMLElement;
    rowAt(1).click();
    openLedgerEntry.mock.calls[0]![1]("unchanged");
    expect(document.activeElement).toBe(rowAt(1));
    rowAt(0).click();
    openLedgerEntry.mock.calls[1]![1]("deleted");
    change(campaignOf(["$ 2 gp tip"]));
    expect(document.activeElement).toBe(root.querySelector(`${PARTY_PANEL} .dd-ledger-panel .dd-create`));
  });

  it("opens an item from its row, and puts focus back on it once it has moved to Gone", async () => {
    const openItem = vi.fn<OpenItem>();
    const { root, change } = await openPage({ campaign: campaignOf(["$ Rope", "$ Torch"]), noteNames: [], addCoin: null, openLedgerEntry: null, openItem, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    const rowOf = (name: string) => root.querySelector(`.dd-items-panel .dd-row[data-item="${name}"]`) as HTMLElement;
    rowOf("Torch").click();
    expect(openItem).toHaveBeenCalledWith("Torch", { path: "Pale Moon/Sessions/Session 1.md", line: 1 }, expect.any(Function));
    openItem.mock.calls[0]![2](true);
    change(campaignOf(["$ Rope", "$ Torch", "$$ Torch :lost"]));
    expect(document.activeElement).toBe(rowOf("Torch"));
    expect(rowOf("Torch").closest("details")?.open).toBe(true);
    rowOf("Rope").click();
    openItem.mock.calls[1]![2](false);
    expect(document.activeElement).toBe(rowOf("Rope"));
  });

  it("shows the tab an item is in before it puts focus back on it, also when the change moved it to the other tab", async () => {
    const openItem = vi.fn<OpenItem>();
    const { root, change, owners } = await openPage({ campaign: campaignOf(["$ [[Zed]] Rope"]), noteNames: [], addCoin: null, openLedgerEntry: null, openItem, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    const selected = () => Array.from(root.querySelectorAll("[role=tab]")).map((tab) => tab.getAttribute("aria-selected"));
    Array.from(root.querySelectorAll<HTMLElement>("[role=tab]")).find((tab) => tab.textContent === "Party")?.click();
    elementIn(root, `${PARTY_PANEL} .dd-row`).click();
    owners.names = () => ["Zed"];
    openItem.mock.calls[0]?.[2](true);
    change(campaignOf(["$ [[Zed]] Rope"]));
    expect(selected()).toEqual(["true", "false"]);
    expect(document.activeElement).toBe(elementIn(root, `${MINE_PANEL} .dd-row`));
  });

  it("shows the Party tab before it puts focus back on a party item", async () => {
    const openItem = vi.fn<OpenItem>();
    const { root, change } = await openPage({ campaign: campaignOf(["$ Rope"]), noteNames: [], addCoin: null, openLedgerEntry: null, openItem, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    elementIn(root, `${PARTY_PANEL} .dd-row`).click();
    openItem.mock.calls[0]?.[2](true);
    change(campaignOf(["$ Rope", "$$ Rope :lost"]));
    expect(Array.from(root.querySelectorAll("[role=tab]")).map((tab) => tab.getAttribute("aria-selected"))).toEqual(["false", "true"]);
    expect(document.activeElement).toBe(elementIn(root, `${PARTY_PANEL} .dd-row`));
  });

  it("opens a sale in the ledger as any entry, and puts focus back on the sale after the redraw", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const openItem = vi.fn<OpenItem>();
    const lines = ["$ Rope", "$$ Rope :sold 3 gp"];
    const { root, change } = await openPage({ campaign: campaignOf(lines), noteNames: [], addCoin: vi.fn(), openLedgerEntry, openItem, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    const rowAt = (line: number) => root.querySelector(`${PARTY_PANEL} .dd-ledger-row[data-line="${line}"]`) as HTMLElement;
    rowAt(1).click();
    expect(openLedgerEntry).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 }, expect.any(Function));
    openLedgerEntry.mock.calls[0]![1]("written");
    change(campaignOf(["$ Rope", "$$ Rope :sold 4 gp"]));
    expect(document.activeElement).toBe(rowAt(1));
    expect(openItem).not.toHaveBeenCalled();
  });

  it("forgets an item's pending focus once it is stale", async () => {
    const openItem = vi.fn<OpenItem>();
    const { root, change } = await openPage({ campaign: campaignOf(["$ Rope", "$ Torch"]), noteNames: [], addCoin: null, openLedgerEntry: null, openItem, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    (root.querySelector('.dd-row[data-item="Torch"]') as HTMLElement).click();
    openItem.mock.calls[0]![2](true);
    now.mockReturnValue(1000 + 3001);
    change(campaignOf(["$ Rope", "$ Torch", "$$ Torch :lost"]));
    now.mockRestore();
    expect(document.activeElement).toBe(document.body);
  });

  it("forgets a pending focus once it is stale", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const { root, change } = await openPage({ campaign: campaignOf(["$ 5 gp found", "$ 2 gp tip"]), noteNames: [], addCoin: vi.fn(), openLedgerEntry, openItem: null, shownItem: null, ownNames: [] });
    const document = root.ownerDocument;
    document.body.append(root);
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    (root.querySelector('.dd-ledger-row[data-line="1"]') as HTMLElement).click();
    openLedgerEntry.mock.calls[0]![1]("written");
    now.mockReturnValue(1000 + 3001);
    change(campaignOf(["$ 5 gp found", "$ 3 gp tip"]));
    now.mockRestore();
    expect(document.activeElement).toBe(document.body);
  });

  it("shows the item it was opened on above everything else, and marks its row", async () => {
    const panels: HTMLElement[] = [];
    const makePanel = (panelEl: HTMLElement) => {
      panels.push(panelEl);
      return new Component();
    };
    const shown = { name: "silvered lantern", panel: makePanel };
    const { root } = await openPage({ campaign: campaignOf(["$ [[Mira]] [[Silvered lantern]]", "$ Potion of healing"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: shown, ownNames: [] });
    expect(panels).toHaveLength(1);
    expect(root.firstElementChild).toBe(panels[0]);
    expect(panels[0]!.classList.contains("dd-shown-item")).toBe(true);
    const marked = Array.from(root.querySelectorAll<HTMLElement>(".dd-row-shown"));
    expect(marked.map((row) => row.dataset.item)).toEqual(["Silvered lantern"]);
    expect(marked[0]!.getAttribute("aria-current")).toBe("true");
  });

  it("unfolds the gone items when the item it was opened on is gone", async () => {
    const shown = { name: "Potion of healing", panel: () => new Component() };
    const { root } = await openPage({ campaign: campaignOf(["$ Potion of healing"], ["$$ Potion of healing :used"]), noteNames: [], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: shown, ownNames: [] });
    const folded = root.querySelector<HTMLDetailsElement>(`${PARTY_PANEL} .dd-folded`);
    expect(folded?.open).toBe(true);
    expect(folded?.querySelector(".dd-row-shown")).not.toBeNull();
  });

  it("marks no row and leaves gone items folded when opened on no item", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ Potion of healing"], ["$$ Potion of healing :used"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(root.querySelector(".dd-row-shown")).toBeNull();
    expect(root.querySelector<HTMLDetailsElement>(`${PARTY_PANEL} .dd-folded`)?.open).toBe(false);
    expect(root.querySelector(".dd-shown-item")).toBeNull();
  });
});

describe("FundsPage with his funds and the party's in two tabs", () => {
  const LINES = ["$ [[Mira]] Flame Tongue", "$ [[Zed]] Rope", "$ Potion of healing", "$ [[Mira]] Spyglass", "$ +50 gp advance"];

  it("makes a Mine tab and a Party tab, his first and showing", async () => {
    const { root } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    const tabs = Array.from(root.querySelectorAll("[role=tab]"));
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Mine", "Party"]);
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["true", "false"]);
    expect(root.querySelector(MINE_PANEL)?.getAttribute("style")).not.toBe("display: none;");
    expect(root.querySelector(PARTY_PANEL)?.getAttribute("style")).toBe("display: none;");
  });

  it("shows the party's tab when it is pressed", async () => {
    const { root } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    Array.from(root.querySelectorAll<HTMLElement>("[role=tab]")).find((tab) => tab.textContent === "Party")?.click();
    expect(root.querySelector(MINE_PANEL)?.getAttribute("style")).toBe("display: none;");
    expect(root.querySelector(PARTY_PANEL)?.getAttribute("style")).not.toBe("display: none;");
  });

  it("puts the items his character holds in Mine, and every other holder's, with the party's own, in Party", async () => {
    const { root } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(root, `${MINE_PANEL} .dd-holder`)).toEqual(["Mira"]);
    expect(textsOf(root, `${MINE_PANEL} .dd-scroll-list > .dd-list .dd-text`)).toEqual(["Spyglass", "Flame Tongue"]);
    expect(textsOf(root, `${MINE_PANEL} .dd-items-panel .dd-title .dd-count`)).toEqual(["2 held"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-holder`)).toEqual(["Zed", "The party"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-scroll-list > .dd-list .dd-text`)).toEqual(["Rope", "Potion of healing"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-items-panel .dd-title .dd-count`)).toEqual(["2 held"]);
  });

  it("keeps the party purse and its ledger in Party", async () => {
    const { root } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["50 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-what`)).toEqual(["+50 gp advance"]);
    expect(textsOf(root, `${MINE_PANEL} .dd-purse`)).toEqual(["0 gp"]);
  });

  it("lists the coin lines that link his character anywhere in the ledger of Mine, newest first, and keeps them out of Party", async () => {
    const campaign = campaignOf(["$ 30 gp from the bandits, share to [[Mira]]", "$ +50 gp advance", "$ [[Mira]] +5 gp tip"], ["$$ Rope :sold 20 gp to [[Mira]]"]);
    const { root } = await openPage({ campaign, noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(root, `${MINE_PANEL} .dd-ledger .dd-what`)).toEqual(["Rope :sold 20 gp to [[Mira]]", "[[Mira]] +5 gp tip", "30 gp from the bandits, share to [[Mira]]"]);
    expect(textsOf(root, `${MINE_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual(["3 entries"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-what`)).toEqual(["+50 gp advance"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["50 gp"]);
  });

  it("shows no party-only coin line in the ledger of Mine", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ +50 gp advance", "$ 5 gp from [[Zed]]"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(root.querySelector(`${MINE_PANEL} .dd-ledger-row`)).toBeNull();
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-amount`)).toEqual(["+5 gp", "+50 gp"]);
  });

  it("shows the ledger of Mine when it is empty, or that no character is named", async () => {
    const holdsNone = await openPage({ campaign: campaignOf(["$ +50 gp advance"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(holdsNone.root, `${MINE_PANEL} .dd-ledger .dd-empty`)).toEqual([
      "No coin yet. Try “$ 20 gp”.",
    ]);
    expect(textsOf(holdsNone.root, `${MINE_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual([""]);
    const none = await openPage({ campaign: campaignOf(["$ +50 gp advance"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(none.root, `${MINE_PANEL} .dd-ledger .dd-empty`)).toEqual(["No character of yours yet."]);
  });

  it("opens a ledger entry of Mine to change it, and puts focus back on it after the redraw", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const lines = ["$ 5 gp from [[Mira]]"];
    const { root, change } = await openPage({ campaign: campaignOf(lines), noteNames: [], addCoin: vi.fn(), openLedgerEntry, openItem: null, shownItem: null, ownNames: ["Mira"] });
    const document = root.ownerDocument;
    document.body.append(root);
    expect(root.querySelector(`${MINE_PANEL} .dd-create`)).toBeNull();
    elementIn(root, `${MINE_PANEL} .dd-ledger-row`).click();
    expect(openLedgerEntry).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 0 }, expect.any(Function));
    openLedgerEntry.mock.calls[0]![1]("written");
    change(campaignOf(lines));
    expect(document.activeElement).toBe(elementIn(root, `${MINE_PANEL} .dd-ledger-row`));
  });

  it("puts focus on the list of Mine's ledger when the entry it opened has left it", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const { root, change } = await openPage({ campaign: campaignOf(["$ 5 gp from [[Mira]]"]), noteNames: [], addCoin: null, openLedgerEntry, openItem: null, shownItem: null, ownNames: ["Mira"] });
    const document = root.ownerDocument;
    document.body.append(root);
    elementIn(root, `${MINE_PANEL} .dd-ledger-row`).click();
    openLedgerEntry.mock.calls[0]![1]("written");
    change(campaignOf(["$ 5 gp from Mira"]));
    expect(document.activeElement).toBe(elementIn(root, `${MINE_PANEL} .dd-ledger`));
  });

  it("gives the gone items to the side that held them", async () => {
    const { root } = await openPage({ campaign: campaignOf(LINES, ["$$ Spyglass :sold 20 gp to [[Mira]]", "$$ Rope :used"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(root, `${MINE_PANEL} .dd-folded .dd-text`)).toEqual(["Spyglass"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-folded .dd-text`)).toEqual(["Rope"]);
  });

  it("says no character of his is named when none is, and says no items yet when one is but holds none", async () => {
    const none = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(none.root, `${MINE_PANEL} .dd-items-panel .dd-scroll-list > .dd-empty`)).toEqual(["No character of yours yet."]);
    const holdsNone = await openPage({ campaign: campaignOf(["$ [[Zed]] Rope"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(holdsNone.root, `${MINE_PANEL} .dd-items-panel .dd-scroll-list > .dd-empty`)).toEqual([
      "No items yet. Try “$ Rope”.",
    ]);
  });

  it("moves the items when his character is named or changes, without the notes changing", async () => {
    const { root, owners } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    owners.names = () => ["Zed"];
    owners.listener();
    expect(textsOf(root, `${MINE_PANEL} .dd-holder`)).toEqual(["Zed"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-holder`)).toEqual(["Mira", "The party"]);
  });

  it("scrolls the ledger and each list of items, in boxes the keyboard can reach", async () => {
    const { root } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    const boxes = Array.from(root.querySelectorAll<HTMLElement>(".dd-scroll-list"));
    expect(boxes.map((box) => box.getAttribute("aria-label"))).toEqual(["Items that are yours", "Your ledger entries", "Items of the party", "Party ledger entries"]);
    expect(boxes.every((box) => box.getAttribute("tabindex") === "0")).toBe(true);
    expect(root.querySelector(`${PARTY_PANEL} .dd-ledger.dd-scroll-list`)).not.toBeNull();
  });

  it("stops listening for his character when closed", async () => {
    const { owners, close } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(owners.listening).toBe(true);
    close();
    expect(owners.listening).toBe(false);
  });
});

describe("FundsPage with a purse of his own coin lines in Mine", () => {
  const OWN_PURSE = `${MINE_PANEL} .dd-purse-panel`;

  async function pageFor(lines: string[], ownNames: string[]) {
    return openPage({ campaign: campaignOf(lines), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames });
  }

  it("totals the coin lines that link his character, with money in and out", async () => {
    const { root } = await pageFor(["$ 30 gp from the bandits, share to [[Mira]]", "$ Paid 5 gp 2 sp for rope, [[Mira]]", "$ +50 gp advance"], ["Mira"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-title`)).toEqual(["Purse"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-purse`)).toEqual(["24 gp 8 sp"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-in-out > span`)).toEqual(["In 30 gp", "Out 5 gp 2 sp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["50 gp"]);
  });

  it("shows the coins it is made of when they read differently from it", async () => {
    const { root } = await pageFor(["$ 1 pp found by [[Mira]]", "$ 5 gp found by [[Mira]]"], ["Mira"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-coins-label`)).toEqual(["In coins:"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-coin`)).toEqual(["1 pp", "5 gp"]);
  });

  it("leaves the coins out when they read the same as the purse", async () => {
    const { root } = await pageFor(["$ 5 gp found by [[Mira]]"], ["Mira"]);
    expect(root.querySelector(`${OWN_PURSE} .dd-coin`)).toBeNull();
  });

  it("matches his character's link whatever its capitals", async () => {
    const { root } = await pageFor(["$ 7 gp from the bandits, share to [[mira]]"], ["Mira"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-purse`)).toEqual(["7 gp"]);
  });

  it("adds up the lines of every character of his", async () => {
    const { root } = await pageFor(["$ 5 gp a [[Mira]]", "$ Paid 2 gp b [[Bo]]", "$ 9 gp c"], ["Mira", "Bo"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-purse`)).toEqual(["3 gp"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-in-out > span`)).toEqual(["In 5 gp", "Out 2 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["9 gp"]);
  });

  it("counts a sale line that links his character", async () => {
    const { root } = await pageFor(["$ Rope", "$$ Rope :sold 20 gp to [[Mira]]"], ["Mira"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-purse`)).toEqual(["20 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["0 gp"]);
  });

  it("says no coin of his yet when none of the lines link his character", async () => {
    const { root } = await pageFor(["$ +50 gp advance"], ["Mira"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-purse`)).toEqual(["0 gp"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-coins .dd-empty`)).toEqual([
      "No coin yet. Try “$ 20 gp”.",
    ]);
  });

  it("says no character is named when the campaign note names none", async () => {
    const { root } = await pageFor(["$ +50 gp advance", "$ 5 gp from [[Mira]]"], []);
    expect(textsOf(root, `${OWN_PURSE} .dd-purse`)).toEqual(["0 gp"]);
    expect(textsOf(root, `${OWN_PURSE} .dd-coins .dd-empty`)).toEqual(["No character of yours yet."]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["55 gp"]);
  });

  it("sits above the ledger of Mine and redraws when the lines change", async () => {
    const { root, change } = await pageFor([], ["Mira"]);
    expect(root.querySelector(`${MINE_PANEL} .dd-purse-panel ~ .dd-ledger-panel`)).not.toBeNull();
    change(campaignOf(["$ 9 gp found by [[Mira]]"]));
    expect(textsOf(root, `${OWN_PURSE} .dd-purse`)).toEqual(["9 gp"]);
  });
});

describe("FundsPage with one purse of his character in Mine", () => {
  const MINE_PURSE = `${MINE_PANEL} .dd-purse-panel`;
  const SHEET: OwnSheet = { name: "Mira", purse: [{ coin: "pp", count: 1 }, { coin: "gp", count: 19 }], importedSession: 1 };

  async function pageFor(lines: string[], sheets: OwnSheet[]) {
    return openPage({ campaign: campaignOf(["$ +50 gp advance"], lines), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: sheets.map((sheet) => sheet.name), sheets });
  }

  it("is the sheet's purse with the own lines of later sessions added, in the one purse of the tab", async () => {
    const { root } = await pageFor(["$ 5 gp from the bandits, share to [[Mira]]", "$ Paid 2 gp for rope, [[Mira]]"], [SHEET]);
    expect(root.querySelectorAll(`${MINE_PANEL} .dd-purse-panel`)).toHaveLength(1);
    expect(textsOf(root, `${MINE_PURSE} .dd-purse`)).toEqual(["32 gp"]);
  });

  it("shows the coins it is made of, and money in with the sheet's coin in it", async () => {
    const { root } = await pageFor(["$ 5 gp from the bandits, share to [[Mira]]", "$ Paid 2 gp for rope, [[Mira]]"], [SHEET]);
    expect(textsOf(root, `${MINE_PURSE} .dd-coin`)).toEqual(["1 pp", "22 gp"]);
    expect(textsOf(root, `${MINE_PURSE} .dd-in-out > span`)).toEqual(["In 34 gp", "Out 2 gp"]);
  });

  it("shows nothing of it before the sheets are read", async () => {
    const root = obsidianDocument().createElement("div");
    const owners = new MadeUpOwnCharacters(() => ["Mira"]);
    const held = new HeldCalls<OwnSheet[]>();
    owners.sheets = () => held.hold();
    const view = new FundsPage({
      contentEl: root,
      store: { current: campaignOf(["$ 5 gp from [[Mira]]"]), subscribe: () => () => {} },
      actions: { openRow: vi.fn(), openLink: vi.fn() },
      noteExists: () => true,
      addCoin: null,
      openLedgerEntry: null,
      openItem: null,
      shownItem: null,
      ownCharacters: owners,
    });
    view.load();
    expect(root.querySelector(`${MINE_PURSE} .dd-purse`)).toBeNull();
    expect(root.querySelector(`${PARTY_PANEL} .dd-purse`)).not.toBeNull();
    held.resolve(0, [SHEET]);
    await view.rendered();
    expect(textsOf(root, `${MINE_PURSE} .dd-purse`)).toEqual(["29 gp"]);
  });

  it("redraws with the new session when his character's note changes", async () => {
    const { root, owners, view } = await pageFor(["$ 5 gp from [[Mira]]"], [SHEET]);
    expect(textsOf(root, `${MINE_PURSE} .dd-coin`)).toEqual(["1 pp", "24 gp"]);
    owners.known = [{ ...SHEET, importedSession: 2 }];
    owners.listener();
    await view.rendered();
    expect(textsOf(root, `${MINE_PURSE} .dd-coin`)).toEqual(["1 pp", "19 gp"]);
  });

  it("keeps the later read when an earlier one finishes last", async () => {
    const { root, owners, view } = await pageFor([], [SHEET]);
    const held = new HeldCalls<OwnSheet[]>();
    owners.sheets = () => held.hold();
    owners.listener();
    owners.listener();
    held.resolve(1, [{ ...SHEET, purse: [{ coin: "gp", count: 7 }] }]);
    await Promise.resolve();
    held.resolve(0, [{ ...SHEET, purse: [{ coin: "gp", count: 3 }] }]);
    await view.rendered();
    expect(textsOf(root, `${MINE_PURSE} .dd-purse`)).toEqual(["7 gp"]);
  });

  it("draws nothing more once closed", async () => {
    const { root, owners, view } = await pageFor([], [SHEET]);
    const held = new HeldCalls<OwnSheet[]>();
    owners.sheets = () => held.hold();
    owners.listener();
    view.unload();
    held.resolve(0, [{ ...SHEET, purse: [{ coin: "gp", count: 7 }] }]);
    await view.rendered();
    expect(textsOf(root, `${MINE_PURSE} .dd-purse`)).toEqual(["29 gp"]);
  });

  it("says no coin yet in the purse of a character with nothing", async () => {
    const { root } = await pageFor([], [{ name: "Mira", purse: null, importedSession: null }]);
    expect(textsOf(root, `${MINE_PURSE} .dd-purse`)).toEqual(["0 gp"]);
    expect(textsOf(root, `${MINE_PURSE} .dd-coins .dd-empty`)).toHaveLength(1);
  });

  it("leaves the party purse and its ledger as they were", async () => {
    const { root } = await pageFor(["$ 5 gp from [[Mira]]"], [SHEET]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["50 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-what`)).toEqual(["+50 gp advance"]);
    expect(textsOf(root, `${MINE_PANEL} .dd-ledger .dd-what`)).toEqual(["5 gp from [[Mira]]"]);
  });
});
