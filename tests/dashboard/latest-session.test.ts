import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote } from "../../src/campaign/campaign";
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
});
