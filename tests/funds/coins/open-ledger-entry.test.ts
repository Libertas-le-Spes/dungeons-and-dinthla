import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign, Source } from "../../../src/campaign/record/campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { CoinOutcome } from "../../../src/funds/coins/coin-modal";
import { ledgerEntryOpener, routeLedgerEntry, type LedgerOpeners } from "../../../src/funds/coins/open-ledger-entry";
import { openedModals } from "../../stubs/obsidian";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function campaignOf(...sessions: string[][]): Campaign {
  return buildCampaign(
    sessions.map((lines, index) => ({ path: `Pale Moon/Sessions/Session ${index + 1}.md`, number: index + 1, firstLine: 0, text: lines.join("\n") })),
  );
}

function routeAt(campaign: Campaign, source: Source) {
  const openers = {
    coinEntry: vi.fn<LedgerOpeners["coinEntry"]>(),
    item: vi.fn<LedgerOpeners["item"]>(),
  };
  const onClosed = vi.fn<(outcome: CoinOutcome) => void>();
  routeLedgerEntry(campaign.items, source, openers, onClosed);
  return { openers, onClosed };
}

describe("routeLedgerEntry", () => {
  it("opens a sale as its item, and says whether the item changed", () => {
    const { openers, onClosed } = routeAt(campaignOf(["$ Rope", "$$ Rope :sold 3 gp"]), { path: ONE, line: 1 });
    expect(openers.item).toHaveBeenCalledWith("Rope", { path: ONE, line: 1 }, expect.any(Function));
    expect(openers.coinEntry).not.toHaveBeenCalled();
    openers.item.mock.calls[0]![2](true);
    openers.item.mock.calls[0]![2](false);
    expect(onClosed.mock.calls).toEqual([["written"], ["unchanged"]]);
  });

  it("opens any other entry as a coin entry", () => {
    const { openers, onClosed } = routeAt(campaignOf(["$ Rope", "$ 5 gp found"]), { path: ONE, line: 1 });
    expect(openers.coinEntry).toHaveBeenCalledWith({ path: ONE, line: 1 }, onClosed);
    expect(openers.item).not.toHaveBeenCalled();
  });

  it("doesn't take an item that went on the same line of another session for a sale", () => {
    const { openers } = routeAt(campaignOf(["$ Rope", "$ 5 gp found"], ["$ Torch", "$$ Torch :lost"]), { path: ONE, line: 1 });
    expect(openers.coinEntry).toHaveBeenCalledOnce();
    expect(openers.item).not.toHaveBeenCalled();
  });

  it("doesn't take an item that went on another line of the same session for a sale", () => {
    const { openers } = routeAt(campaignOf(["$ Rope", "$$ Rope :lost", "$ 5 gp found"]), { path: ONE, line: 2 });
    expect(openers.coinEntry).toHaveBeenCalledOnce();
    expect(openers.item).not.toHaveBeenCalled();
  });

  it("opens a sale written in a later session as its item", () => {
    const { openers } = routeAt(campaignOf(["$ Rope"], ["$ 5 gp found", "$$ Rope :sold 3 gp"]), { path: TWO, line: 1 });
    expect(openers.item).toHaveBeenCalledWith("Rope", { path: TWO, line: 1 }, expect.any(Function));
  });
});

describe("ledgerEntryOpener", () => {
  function opener(campaign: Campaign) {
    const store = { current: campaign, sessionNotes: [] };
    const openItem = vi.fn<LedgerOpeners["item"]>();
    const open = ledgerEntryOpener({} as App, { files: {}, notes: { store: {} } } as unknown as Gate, store as unknown as CampaignStore, openItem, STUB_SYNTAX);
    return { store, openItem, open };
  }

  it("opens a sale with the item opener it is given", () => {
    const { openItem, open } = opener(campaignOf(["$ Rope", "$$ Rope :sold 3 gp"]));
    const before = openedModals.length;
    open({ path: ONE, line: 1 }, vi.fn());
    expect(openItem).toHaveBeenCalledWith("Rope", { path: ONE, line: 1 }, expect.any(Function));
    expect(openedModals.length).toBe(before);
  });

  it("opens any other entry in the ledger entry dialog", () => {
    const { openItem, open } = opener(campaignOf(["$ 5 gp found"]));
    const before = openedModals.length;
    open({ path: ONE, line: 0 }, vi.fn());
    expect(openedModals.slice(before).map((dialog) => dialog.title)).toEqual(["Ledger entry"]);
    expect(openItem).not.toHaveBeenCalled();
  });

  it("reads the items as they are when the entry is opened", () => {
    const { store, openItem, open } = opener(campaignOf(["$ Rope", "$ 3 gp"]));
    store.current = campaignOf(["$ Rope", "$$ Rope :sold 3 gp"]);
    open({ path: ONE, line: 1 }, vi.fn());
    expect(openItem).toHaveBeenCalledOnce();
  });
});
