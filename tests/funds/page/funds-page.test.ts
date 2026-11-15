import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, Source } from "../../../src/campaign/record/campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { CoinOutcome } from "../../../src/funds/coins/coin-modal";
import { Component } from "obsidian";
import { FundsPage, type FundsStore, type PursesBeside, type ShownItem } from "../../../src/funds/page/funds-page";
import { OwnPursePanel, type PurseStore } from "../../../src/funds/purses/own-purse-panel";
import { FakePurseNotes } from "../purses/fake-purse-notes";
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
}

const PARTY_PANEL = '[role="tabpanel"][id$="-panel-1"]';
const MINE_PANEL = '[role="tabpanel"][id$="-panel-0"]';

class MadeUpOwnCharacters {
  listener: () => void = () => {};
  listening = false;

  constructor(public names: () => string[]) {}

  subscribe(changed: () => void): () => void {
    this.listener = changed;
    this.listening = true;
    return () => {
      this.listening = false;
    };
  }
}

async function openPage({ campaign, noteNames, addCoin, openLedgerEntry, openItem, shownItem, ownNames }: PageParts) {
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
  const view = new FundsPage({
    contentEl: root,
    store: store as unknown as CampaignStore,
    actions,
    noteExists,
    addCoin,
    openLedgerEntry,
    openItem,
    shownItem,
    pursesBeside: null,
    ownCharacters: owners,
  });
  view.load();
  const change = (next: Campaign) => {
    store.current = next;
    listener(next);
  };
  const close = () => view.unload();
  return { root, actions, change, close, unsubscribe, owners };
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
    expect(textsOf(root, ".dd-purse")).toEqual(["83 gp 4 sp"]);
    expect(textsOf(root, ".dd-in-out > span")).toEqual(["In 85 gp 4 sp", "Out 2 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-amount`)).toEqual(["+35 gp 4 sp", "−2 gp", "+50 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-direction`)).toEqual(["In", "Out", "In"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-balance`)).toEqual(["83 gp 4 sp", "48 gp", "50 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-what`)).toEqual(["35 gp 4 sp from the bandits", "Paid 2 gp for rooms", "+50 gp advance"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual(["3 entries"]);
  });

  it("shows the coins the purse is made of when they read differently from it", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 1 pp found", "$ 5 gp found"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, ".dd-coin")).toEqual(["1 pp", "5 gp"]);
  });

  it("leaves the coins out when they read the same as the purse", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 35 gp 4 sp found"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(root.querySelector(".dd-coin")).toBeNull();
  });

  it("says how to note coin when there is none", async () => {
    const { root } = await openPage({ campaign: campaignOf([]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, ".dd-coins .dd-empty")).toEqual(["No coin yet. Note it as “$ 20 gp from the bandits”. A link to your character on the line, like “$ 30 gp from the bandits, share to [[Mira]]”, puts it on your list."]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-empty`)).toEqual(["No coin entries yet."]);
    expect(textsOf(root, ".dd-purse")).toEqual(["0 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual([""]);
  });

  it("counts one entry as an entry", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 5 gp"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual(["1 entry"]);
  });

  it("writes large coin counts as the purse does, so they aren't shown twice", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 1200 gp from the dragon"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, ".dd-purse")).toEqual(["1,200 gp"]);
    expect(root.querySelector(".dd-coin")).toBeNull();
  });

  it("labels the coins the purse is made of", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 1 pp found", "$ 5 gp found"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, ".dd-coins-label")).toEqual(["In coins:"]);
  });

  it("redraws when notes change, and stops listening when closed", async () => {
    const { root, change, close, unsubscribe } = await openPage({ campaign: campaignOf([]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    change(campaignOf(["$ 5 gp found"]));
    expect(textsOf(root, ".dd-purse")).toEqual(["5 gp"]);
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

  it("says how to note an item, and that nothing is gone, when there are none", async () => {
    const { root } = await openPage({ campaign: campaignOf(["$ 5 gp"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-scroll-list > .dd-empty`)).toEqual([
      "No items held. A $ line with no amount adds one, like “$ Rope found at the old mill”.",
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

  it("keeps the purse and the ledger in Party only", async () => {
    const { root } = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(root, `${PARTY_PANEL} .dd-purse`)).toEqual(["50 gp"]);
    expect(textsOf(root, `${PARTY_PANEL} .dd-ledger .dd-what`)).toEqual(["+50 gp advance"]);
    expect(root.querySelector(`${MINE_PANEL} .dd-purse`)).toBeNull();
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

  it("shows the ledger of Mine when it is empty, saying how a line gets there, or that no character is named", async () => {
    const holdsNone = await openPage({ campaign: campaignOf(["$ +50 gp advance"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(holdsNone.root, `${MINE_PANEL} .dd-ledger .dd-empty`)).toEqual([
      "No coin of yours yet. Put your character's link anywhere on a $ line with an amount, like “$ 30 gp from the bandits, share to [[Mira]]”.",
    ]);
    expect(textsOf(holdsNone.root, `${MINE_PANEL} .dd-ledger-panel .dd-title .dd-count`)).toEqual([""]);
    const none = await openPage({ campaign: campaignOf(["$ +50 gp advance"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(none.root, `${MINE_PANEL} .dd-ledger .dd-empty`)).toEqual(["You have not named your character in this campaign yet."]);
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

  it("says no character of his is named when none is, and says how to note an item when one is but holds none", async () => {
    const none = await openPage({ campaign: campaignOf(LINES), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: [] });
    expect(textsOf(none.root, `${MINE_PANEL} .dd-items-panel .dd-scroll-list > .dd-empty`)).toEqual(["You have not named your character in this campaign yet."]);
    const holdsNone = await openPage({ campaign: campaignOf(["$ [[Zed]] Rope"]), noteNames: ["Mira"], addCoin: null, openLedgerEntry: null, openItem: null, shownItem: null, ownNames: ["Mira"] });
    expect(textsOf(holdsNone.root, `${MINE_PANEL} .dd-items-panel .dd-scroll-list > .dd-empty`)).toEqual([
      "No items of yours yet. Put your character's link anywhere on a $ line with no amount, like “$ Flame Tongue longsword found by [[Mira]]”.",
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

const PRIMARY_MONK = "Pale Moon/Characters/Primary Monk.md";
const IMPORTED_1200_GP = "---\nimported-from: pdf\n---\n## Purse (from D&D Beyond)\n- gp · 1200\n";

class HisPurses {
  private readonly made: OwnPursePanel[] = [];

  constructor(
    private readonly notes: FakePurseNotes,
    private readonly store: PurseStore,
  ) {}

  panel(panelEl: HTMLElement): Component {
    const panel = new OwnPursePanel(panelEl, this.store, this.notes);
    this.made.push(panel);
    return panel;
  }

  async rendered(): Promise<void> {
    for (const panel of this.made) await panel.rendered();
  }
}

class MadeUpPurses {
  readonly panels: HTMLElement[] = [];

  panel(panelEl: HTMLElement): Component {
    this.panels.push(panelEl);
    panelEl.setText("His purse");
    return new Component();
  }
}

describe("FundsPage with his purse beside the party's", () => {
  it("puts his purse first in his own tab, in its own panel, and leaves it out of the party's tab", () => {
    const purses = new MadeUpPurses();
    const root = obsidianDocument().createElement("div");
    const store = { current: campaignOf(["$ +50 gp advance"]), subscribe: subscribeNever };
    openWithPurses({ root, store, purses });
    expect(root.querySelector(`${MINE_PANEL} > .dd-own-purse-panel:first-child`)).not.toBeNull();
    expect(root.querySelector(`${PARTY_PANEL} .dd-own-purse-panel`)).toBeNull();
    expect(purses.panels).toHaveLength(1);
  });

  it("shows his 1,200 gp in his own purse and leaves the party purse at its 50 gp", async () => {
    const root = obsidianDocument().createElement("div");
    const store = { campaignFolder: "Pale Moon", current: campaignOf(["$ +50 gp advance"]), subscribe: subscribeNever };
    const purses = new HisPurses(new FakePurseNotes(new Map([[PRIMARY_MONK, IMPORTED_1200_GP]]), [PRIMARY_MONK]), store);
    openWithPurses({ root, store, purses });
    await purses.rendered();
    expect(textsOf(root, ".dd-purse-panel .dd-purse")).toEqual(["50 gp"]);
    expect(textsOf(root, ".dd-own-purse-panel .dd-coin")).toEqual(["1,200 gp"]);
  });
});

interface WithPurses {
  root: HTMLElement;
  store: FundsStore;
  purses: PursesBeside;
}

function openWithPurses({ root, store, purses }: WithPurses): void {
  const parts = {
    contentEl: root,
    store,
    actions: { openRow: vi.fn(), openLink: vi.fn() },
    noteExists: noNote,
    addCoin: null,
    openLedgerEntry: null,
    openItem: null,
    shownItem: null,
    pursesBeside: purses,
    ownCharacters: new MadeUpOwnCharacters(() => []),
  };
  new FundsPage(parts).load();
}

function subscribeNever(): () => void {
  return stopNothing;
}

function stopNothing(): void {}

function noNote(): boolean {
  return false;
}

