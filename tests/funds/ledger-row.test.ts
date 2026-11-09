import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { summariseFunds } from "../../src/funds/funds-summary";
import { addLedgerRow } from "../../src/funds/ledger-row";
import { obsidianDocument } from "../views/obsidian-dom";

const SESSION = "Pale Moon/Sessions/Session 1.md";

function setUp(lines: string[]) {
  const campaign = buildCampaign([{ path: SESSION, number: 1, firstLine: 0, text: lines.join("\n") }]);
  const list = obsidianDocument().createElement("ul");
  const rowActions = { openRow: vi.fn(), openLink: vi.fn() };
  const linkActions = { openRow: vi.fn(), openLink: vi.fn() };
  for (const line of summariseFunds(campaign).ledger) addLedgerRow(list, line, rowActions, linkActions);
  return { row: list.querySelector(".dd-row") as HTMLElement, rowActions, linkActions };
}

describe("addLedgerRow", () => {
  it("opens a linked name from the entry's own line, not the session", () => {
    const { row, rowActions, linkActions } = setUp(["We rode on.", "$ -5 gp paid [[Old Tom]] for rooms"]);
    (row.querySelector("a.dd-link-name") as HTMLElement).click();
    expect(linkActions.openLink).toHaveBeenCalledExactlyOnceWith("Old Tom", { path: SESSION, line: 1 }, false);
    expect(rowActions.openRow).not.toHaveBeenCalled();
  });
});
