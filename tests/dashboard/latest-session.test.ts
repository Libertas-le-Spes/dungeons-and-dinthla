import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../src/campaign/record/campaign";
import { linesWrittenIn, type WrittenLine, type WrittenLineRows } from "../../src/dashboard/latest-session";
import { summariseFunds } from "../../src/funds/page/funds-summary";

function sessionOf(number: number, lines: string[]): SessionNote {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number, firstLine: 0, text: lines.join("\n") };
}

function rowsAddedBy(lines: WrittenLine[]): [string, number][] {
  const added: [string, number][] = [];
  const rows: WrittenLineRows = {
    addThread: (shown, thread) => void added.push([shown.threadKind.tracked.name, thread.source.line]),
    addLedgerLine: (ledgerLine) => void added.push(["coin", ledgerLine.record.source.line]),
    addItemEvent: (itemEvent) => void added.push([`item ${itemEvent.event.kind}`, itemEvent.event.source.line]),
  };
  for (const line of lines) line.addTo(rows);
  return added;
}

describe("linesWrittenIn", () => {
  it("lists the questions, quests and coin entries written in one session, the last written first", () => {
    const earlier = sessionOf(1, ["? Who sent the letter", "! Find the caravan", "$ 5 gp found"]);
    const latest = sessionOf(2, ["? Why does the wheel turn", "notes", "$ Paid 2 gp for rooms", "! Escort Mira", "?= Who sent the letter: Vess"]);
    const campaign = buildCampaign([earlier, latest]);
    const lines = linesWrittenIn(latest.path, campaign, summariseFunds(campaign).ledger);
    expect(lines.map((line) => line.source.line)).toEqual([3, 2, 0]);
    expect(rowsAddedBy(lines)).toEqual([
      ["quest", 3],
      ["coin", 2],
      ["question", 0],
    ]);
  });

  it("lists each line about an item held by more than one once", () => {
    const latest = sessionOf(1, ["$ [[Mira]] Arrow x20", "$$ Arrow x5 :changed to [[Thessaly]]"]);
    const campaign = buildCampaign([latest]);
    expect(rowsAddedBy(linesWrittenIn(latest.path, campaign, summariseFunds(campaign).ledger))).toEqual([
      ["item changed", 1],
      ["item named", 0],
    ]);
  });

  it("lists the items named or changed in the session, and none from another session", () => {
    const earlier = sessionOf(1, ["$ [[Mira]] Rope"]);
    const latest = sessionOf(2, ["$ Silvered lantern", "notes", "$$ Rope :sold"]);
    const campaign = buildCampaign([earlier, latest]);
    const lines = linesWrittenIn(latest.path, campaign, summariseFunds(campaign).ledger);
    expect(rowsAddedBy(lines)).toEqual([
      ["item sold", 2],
      ["item named", 0],
    ]);
  });

  it("lists a sale once, as its coin entry, and not again as the item's line", () => {
    const latest = sessionOf(2, ["$ Silvered lantern", "$$ Silvered lantern :sold 30gp"]);
    const campaign = buildCampaign([latest]);
    const lines = linesWrittenIn(latest.path, campaign, summariseFunds(campaign).ledger);
    expect(rowsAddedBy(lines)).toEqual([
      ["coin", 1],
      ["item named", 0],
    ]);
  });
});
