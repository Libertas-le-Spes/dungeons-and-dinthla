import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, Source } from "../../../src/campaign/record/campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { CoinOutcome } from "../../../src/funds/coins/coin-modal";
import { Component } from "obsidian";
import { FundsPage, type ShownItem } from "../../../src/funds/page/funds-page";
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

async function openPage(
  campaign: Campaign,
  notes: string[] = ["Mira"],
  addCoin: ((returnFocus: () => void) => void) | null = null,
  openLedgerEntry: OpenLedgerEntry | null = null,
  openItem: OpenItem | null = null,
  shownItem: ShownItem | null = null,
) {
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
  const noteExists = (name: string) => notes.includes(name);
  const root = obsidianDocument().createElement("div");
  const view = new FundsPage(root, store as unknown as CampaignStore, actions, noteExists, addCoin, openLedgerEntry, openItem, shownItem, null);
  view.load();
  const change = (next: Campaign) => {
    store.current = next;
    listener(next);
  };
  const close = () => view.unload();
  return { root, actions, change, close, unsubscribe };
}

function textsOf(root: HTMLElement, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

describe("FundsPage", () => {
  it("shows the purse, money in and out, and the ledger newest first with each balance", async () => {
    const { root } = await openPage(campaignOf(["$ +50 gp advance", "$ Paid 2 gp for rooms", "$ 35 gp 4 sp from the bandits"]));
    expect(textsOf(root, ".dd-purse")).toEqual(["83 gp 4 sp"]);
    expect(textsOf(root, ".dd-in-out > span")).toEqual(["In 85 gp 4 sp", "Out 2 gp"]);
    expect(textsOf(root, ".dd-ledger .dd-amount")).toEqual(["+35 gp 4 sp", "−2 gp", "+50 gp"]);
    expect(textsOf(root, ".dd-ledger .dd-direction")).toEqual(["In", "Out", "In"]);
    expect(textsOf(root, ".dd-ledger .dd-balance")).toEqual(["83 gp 4 sp", "48 gp", "50 gp"]);
    expect(textsOf(root, ".dd-ledger .dd-what")).toEqual(["35 gp 4 sp from the bandits", "Paid 2 gp for rooms", "+50 gp advance"]);
    expect(textsOf(root, ".dd-ledger-panel .dd-title .dd-count")).toEqual(["3 entries"]);
  });

  it("shows the coins the purse is made of when they read differently from it", async () => {
    const { root } = await openPage(campaignOf(["$ 1 pp found", "$ 5 gp found"]));
    expect(textsOf(root, ".dd-coin")).toEqual(["1 pp", "5 gp"]);
  });

  it("leaves the coins out when they read the same as the purse", async () => {
    const { root } = await openPage(campaignOf(["$ 35 gp 4 sp found"]));
    expect(root.querySelector(".dd-coin")).toBeNull();
  });

  it("says how to note coin when there is none", async () => {
    const { root } = await openPage(campaignOf([]));
    expect(textsOf(root, ".dd-coins .dd-empty")).toEqual(["No coin yet. Note it as “$ 20 gp from …”."]);
    expect(textsOf(root, ".dd-ledger .dd-empty")).toEqual(["No coin entries yet."]);
    expect(textsOf(root, ".dd-purse")).toEqual(["0 gp"]);
    expect(textsOf(root, ".dd-ledger-panel .dd-title .dd-count")).toEqual([""]);
  });

  it("counts one entry as an entry", async () => {
    const { root } = await openPage(campaignOf(["$ 5 gp"]));
    expect(textsOf(root, ".dd-ledger-panel .dd-title .dd-count")).toEqual(["1 entry"]);
  });

  it("writes large coin counts as the purse does, so they aren't shown twice", async () => {
    const { root } = await openPage(campaignOf(["$ 1200 gp from the dragon"]));
    expect(textsOf(root, ".dd-purse")).toEqual(["1,200 gp"]);
    expect(root.querySelector(".dd-coin")).toBeNull();
  });

  it("labels the coins the purse is made of", async () => {
    const { root } = await openPage(campaignOf(["$ 1 pp found", "$ 5 gp found"]));
    expect(textsOf(root, ".dd-coins-label")).toEqual(["In coins:"]);
  });

  it("redraws when notes change, and stops listening when closed", async () => {
    const { root, change, close, unsubscribe } = await openPage(campaignOf([]));
    change(campaignOf(["$ 5 gp found"]));
    expect(textsOf(root, ".dd-purse")).toEqual(["5 gp"]);
    close();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("opens the session at a ledger line when it is tapped", async () => {
    const { root, actions } = await openPage(campaignOf(["We rode on.", "$ 5 gp"]));
    (root.querySelector(".dd-ledger-row") as HTMLElement).click();
    expect(actions.openRow).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 });
  });

  it("writes an entry that comes to nothing without a sign", async () => {
    const { root } = await openPage(campaignOf(["$ found 5 gp, paid 5 gp toll"]));
    expect(textsOf(root, ".dd-ledger .dd-amount")).toEqual(["0 gp"]);
  });

  it("shows an item's name without the note's escapes, as the note reads", async () => {
    const { root } = await openPage(campaignOf(["$ [[Primary Monk]] Rope (50 ft) \\*silk\\*"]));
    expect(textsOf(root, ".dd-items-panel > .dd-list .dd-text")).toEqual(["Rope (50 ft) *silk*"]);
  });

  it("shows a name typed at the table as written, backslashes and all, when the import wouldn't have written it so", async () => {
    const { root } = await openPage(campaignOf(["$ [[Primary Monk]] \\o/ banner"]));
    expect(textsOf(root, ".dd-items-panel > .dd-list .dd-text")).toEqual(["\\o/ banner"]);
  });

  it("lists held items under their holders, the party's own last, with gone items folded away", async () => {
    const { root } = await openPage(campaignOf(["$ [[Mira]] Flame Tongue", "$ Potion of healing", "$ Spyglass", "$ Rope"], ["$$ Spyglass :sold 20 gp", "$$ Rope :used"]));
    expect(textsOf(root, ".dd-items-panel .dd-holder")).toEqual(["Mira", "The party"]);
    expect(textsOf(root, ".dd-items-panel > .dd-list .dd-text")).toEqual(["Flame Tongue", "Potion of healing"]);
    expect(textsOf(root, ".dd-items-panel > .dd-list .dd-mark-ledger")).toEqual(["$", "$"]);
    expect(textsOf(root, ".dd-items-panel > .dd-title .dd-count")).toEqual(["2 held"]);
    expect(textsOf(root, ".dd-items-panel .dd-folded summary")).toEqual(["Gone2"]);
    expect(root.querySelectorAll(".dd-folded .dd-text.dd-gone")).toHaveLength(2);
  });

  it("says how and in which session each item went, and when its sale is in the ledger", async () => {
    const { root } = await openPage(campaignOf(["$ Spyglass", "$ Rope", "$ Map"], ["$$ Spyglass :sold 20 gp", "$$ Map :sold", "$$ Rope :used"]));
    expect(textsOf(root, ".dd-folded .dd-meta")).toEqual([
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
    const { root, actions } = await openPage(campaignOf(["$ Potion of healing", "$ Rope"], ["We rode on.", "$$ Rope :used"]));
    (root.querySelector(".dd-items-panel > .dd-list .dd-row") as HTMLElement).click();
    expect(actions.openRow).toHaveBeenLastCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 0 });
    (root.querySelector(".dd-folded .dd-row") as HTMLElement).click();
    expect(actions.openRow).toHaveBeenLastCalledWith({ path: "Pale Moon/Sessions/Session 2.md", line: 1 });
  });

  it("says how to note an item, and that nothing is gone, when there are none", async () => {
    const { root } = await openPage(campaignOf(["$ 5 gp"]));
    expect(textsOf(root, ".dd-items-panel > .dd-empty")).toEqual([
      "No items held. A $ line without an amount, like “$ [[Mira]] Flame Tongue longsword”, adds one.",
    ]);
    expect(textsOf(root, ".dd-folded .dd-empty")).toEqual(["Nothing sold, used or lost yet."]);
    expect(textsOf(root, ".dd-items-panel > .dd-title .dd-count")).toEqual([""]);
  });

  it("opens a holder's note when their name is tapped", async () => {
    const { root, actions } = await openPage(campaignOf(["$ [[Mira]] Flame Tongue"]));
    (root.querySelector(".dd-holder a.dd-link-name") as HTMLElement).click();
    expect(actions.openLink).toHaveBeenCalledWith("Mira", "Pale Moon/Sessions/Session 1.md", false);
  });

  it("names a holder without a note in plain text, with no link", async () => {
    const { root } = await openPage(campaignOf(["$ Rope", "$$ Rope :changed to Bob the innkeeper"]), []);
    expect(textsOf(root, ".dd-holder")).toEqual(["Bob the innkeeper"]);
    expect(root.querySelector(".dd-holder a")).toBeNull();
  });

  it("offers Add coin on the ledger when coin can be added, handing it a way back", async () => {
    expect((await openPage(campaignOf([]))).root.querySelector(".dd-ledger-panel .dd-create")).toBeNull();
    const addCoin = vi.fn();
    const { root, change } = await openPage(campaignOf([]), [], addCoin);
    root.ownerDocument.body.append(root);
    const button = root.querySelector(".dd-ledger-panel .dd-create") as HTMLElement;
    expect(button.textContent).toBe("Add coin");
    button.click();
    expect(addCoin).toHaveBeenCalledTimes(1);
    change(campaignOf(["$ 5 gp found"]));
    addCoin.mock.calls[0]![0]();
    expect(root.ownerDocument.activeElement).toBe(button);
    expect(root.querySelector(".dd-ledger-panel .dd-count")?.textContent).toBe("1 entry");
  });

  it("opens a ledger entry to change it, and puts focus back on that entry after the redraw", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const lines = ["$ 5 gp found", "$ 2 gp tip", "$ 7 gp later"];
    const { root, change } = await openPage(campaignOf(lines), [], vi.fn(), openLedgerEntry);
    const document = root.ownerDocument;
    document.body.append(root);
    const rowAt = (line: number) => root.querySelector(`.dd-ledger-row[data-line="${line}"]`) as HTMLElement;
    rowAt(1).click();
    expect(openLedgerEntry).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 }, expect.any(Function));
    openLedgerEntry.mock.calls[0]![1]("written");
    change(campaignOf(["$ 5 gp found", "$ 3 gp tip", "$ 7 gp later"]));
    expect(document.activeElement).toBe(rowAt(1));
    expect(rowAt(1).querySelector(".dd-what")?.textContent).toBe("3 gp tip");
  });

  it("leaves focus alone on a later redraw when an entry closed unchanged", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const { root, change } = await openPage(campaignOf(["$ 5 gp found"]), [], vi.fn(), openLedgerEntry);
    const document = root.ownerDocument;
    document.body.append(root);
    (root.querySelector(".dd-ledger-row") as HTMLElement).click();
    openLedgerEntry.mock.calls[0]![1]("unchanged");
    const editor = document.createElement("input");
    document.body.append(editor);
    editor.focus();
    change(campaignOf(["$ 5 gp found", "$ 1 gp found"]));
    expect(document.activeElement).toBe(editor);
  });

  it("puts focus on Add coin after an entry is deleted, and back on the row when nothing changed", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const { root, change } = await openPage(campaignOf(["$ 5 gp found", "$ 2 gp tip"]), [], vi.fn(), openLedgerEntry);
    const document = root.ownerDocument;
    document.body.append(root);
    const rowAt = (line: number) => root.querySelector(`.dd-ledger-row[data-line="${line}"]`) as HTMLElement;
    rowAt(1).click();
    openLedgerEntry.mock.calls[0]![1]("unchanged");
    expect(document.activeElement).toBe(rowAt(1));
    rowAt(0).click();
    openLedgerEntry.mock.calls[1]![1]("deleted");
    change(campaignOf(["$ 2 gp tip"]));
    expect(document.activeElement).toBe(root.querySelector(".dd-ledger-panel .dd-create"));
  });

  it("opens an item from its row, and puts focus back on it once it has moved to Gone", async () => {
    const openItem = vi.fn<OpenItem>();
    const { root, change } = await openPage(campaignOf(["$ Rope", "$ Torch"]), [], null, null, openItem);
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

  it("opens a sale in the ledger as any entry, and puts focus back on the sale after the redraw", async () => {
    const openLedgerEntry = vi.fn<OpenLedgerEntry>();
    const openItem = vi.fn<OpenItem>();
    const lines = ["$ Rope", "$$ Rope :sold 3 gp"];
    const { root, change } = await openPage(campaignOf(lines), [], vi.fn(), openLedgerEntry, openItem);
    const document = root.ownerDocument;
    document.body.append(root);
    const rowAt = (line: number) => root.querySelector(`.dd-ledger-row[data-line="${line}"]`) as HTMLElement;
    rowAt(1).click();
    expect(openLedgerEntry).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 }, expect.any(Function));
    openLedgerEntry.mock.calls[0]![1]("written");
    change(campaignOf(["$ Rope", "$$ Rope :sold 4 gp"]));
    expect(document.activeElement).toBe(rowAt(1));
    expect(openItem).not.toHaveBeenCalled();
  });

  it("forgets an item's pending focus once it is stale", async () => {
    const openItem = vi.fn<OpenItem>();
    const { root, change } = await openPage(campaignOf(["$ Rope", "$ Torch"]), [], null, null, openItem);
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
    const { root, change } = await openPage(campaignOf(["$ 5 gp found", "$ 2 gp tip"]), [], vi.fn(), openLedgerEntry);
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
    const { root } = await openPage(campaignOf(["$ [[Mira]] [[Silvered lantern]]", "$ Potion of healing"]), ["Mira"], null, null, null, shown);
    expect(panels).toHaveLength(1);
    expect(root.firstElementChild).toBe(panels[0]);
    expect(panels[0]!.classList.contains("dd-shown-item")).toBe(true);
    const marked = Array.from(root.querySelectorAll<HTMLElement>(".dd-row-shown"));
    expect(marked.map((row) => row.dataset.item)).toEqual(["Silvered lantern"]);
    expect(marked[0]!.getAttribute("aria-current")).toBe("true");
  });

  it("unfolds the gone items when the item it was opened on is gone", async () => {
    const shown = { name: "Potion of healing", panel: () => new Component() };
    const { root } = await openPage(campaignOf(["$ Potion of healing"], ["$$ Potion of healing :used"]), [], null, null, null, shown);
    const folded = root.querySelector<HTMLDetailsElement>(".dd-folded")!;
    expect(folded.open).toBe(true);
    expect(folded.querySelector(".dd-row-shown")).not.toBeNull();
  });

  it("marks no row and leaves gone items folded when opened on no item", async () => {
    const { root } = await openPage(campaignOf(["$ Potion of healing"], ["$$ Potion of healing :used"]));
    expect(root.querySelector(".dd-row-shown")).toBeNull();
    expect(root.querySelector<HTMLDetailsElement>(".dd-folded")!.open).toBe(false);
    expect(root.querySelector(".dd-shown-item")).toBeNull();
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
  it("puts his purse right after the party purse, in its own panel", () => {
    const purses = new MadeUpPurses();
    const root = obsidianDocument().createElement("div");
    const store = { current: campaignOf(["$ +50 gp advance"]), subscribe: subscribeNever };
    new FundsPage(root, store, { openRow: vi.fn(), openLink: vi.fn() }, noNote, null, null, null, null, purses).load();
    const classes: string[] = [];
    for (const section of root.children) classes.push(section.className);
    expect(classes.indexOf("dd-panel dd-own-purse-panel")).toBe(classes.indexOf("dd-panel dd-purse-panel") + 1);
    expect(purses.panels).toHaveLength(1);
  });

  it("shows his 1,200 gp in his own purse and leaves the party purse at its 50 gp", async () => {
    const root = obsidianDocument().createElement("div");
    const store = { campaignFolder: "Pale Moon", current: campaignOf(["$ +50 gp advance"]), subscribe: subscribeNever };
    const purses = new HisPurses(new FakePurseNotes(new Map([[PRIMARY_MONK, IMPORTED_1200_GP]]), [PRIMARY_MONK]), store);
    new FundsPage(root, store, { openRow: vi.fn(), openLink: vi.fn() }, noNote, null, null, null, null, purses).load();
    await purses.rendered();
    expect(textsOf(root, ".dd-purse-panel .dd-purse")).toEqual(["50 gp"]);
    expect(textsOf(root, ".dd-own-purse-panel .dd-coin")).toEqual(["1,200 gp"]);
  });
});

function subscribeNever(): () => void {
  return stopNothing;
}

function stopNothing(): void {}

function noNote(): boolean {
  return false;
}

