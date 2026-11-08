import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Source } from "../../src/campaign/campaign";
import type { CoinOutcome } from "../../src/funds/coin-modal";
import { openLedgerEntry, type LedgerOpeners } from "../../src/funds/ledger-row";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function itemsOf(...sessions: string[][]) {
  return buildCampaign(
    sessions.map((lines, index) => ({ path: `Pale Moon/Sessions/Session ${index + 1}.md`, number: index + 1, firstLine: 0, text: lines.join("\n") })),
  ).items;
}

function openAt(items: ReturnType<typeof itemsOf>, source: Source) {
  const openers = {
    coinEntry: vi.fn<LedgerOpeners["coinEntry"]>(),
    item: vi.fn<LedgerOpeners["item"]>(),
  };
  const onClosed = vi.fn<(outcome: CoinOutcome) => void>();
  openLedgerEntry(items, source, openers, onClosed);
  return { openers, onClosed };
}

describe("openLedgerEntry", () => {
  it("opens a sale as its item, and says whether the item changed", () => {
    const { openers, onClosed } = openAt(itemsOf(["$ Rope", "$$ Rope :sold 3 gp"]), { path: ONE, line: 1 });
    expect(openers.item).toHaveBeenCalledWith("Rope", { path: ONE, line: 1 }, expect.any(Function));
    expect(openers.coinEntry).not.toHaveBeenCalled();
    openers.item.mock.calls[0]![2](true);
    openers.item.mock.calls[0]![2](false);
    expect(onClosed.mock.calls).toEqual([["written"], ["unchanged"]]);
  });

  it("opens any other entry as a coin entry", () => {
    const { openers, onClosed } = openAt(itemsOf(["$ Rope", "$ 5 gp found"]), { path: ONE, line: 1 });
    expect(openers.coinEntry).toHaveBeenCalledWith({ path: ONE, line: 1 }, onClosed);
    expect(openers.item).not.toHaveBeenCalled();
  });

  it("doesn't take an item that went on the same line of another session for a sale", () => {
    const { openers } = openAt(itemsOf(["$ Rope", "$ 5 gp found"], ["$ Torch", "$$ Torch :lost"]), { path: ONE, line: 1 });
    expect(openers.coinEntry).toHaveBeenCalledOnce();
    expect(openers.item).not.toHaveBeenCalled();
  });

  it("doesn't take an item that went on another line of the same session for a sale", () => {
    const { openers } = openAt(itemsOf(["$ Rope", "$$ Rope :lost", "$ 5 gp found"]), { path: ONE, line: 2 });
    expect(openers.coinEntry).toHaveBeenCalledOnce();
    expect(openers.item).not.toHaveBeenCalled();
  });

  it("opens a sale written in a later session as its item", () => {
    const { openers } = openAt(itemsOf(["$ Rope"], ["$ 5 gp found", "$$ Rope :sold 3 gp"]), { path: TWO, line: 1 });
    expect(openers.item).toHaveBeenCalledWith("Rope", { path: TWO, line: 1 }, expect.any(Function));
  });
});
