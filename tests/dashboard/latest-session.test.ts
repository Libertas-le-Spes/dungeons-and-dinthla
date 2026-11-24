import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../src/campaign/record/campaign";
import { kindsWrittenIn, latestOfEachKind, linesWrittenIn, type WrittenLine, type WrittenLineRows } from "../../src/dashboard/latest-session";
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

describe("latestOfEachKind", () => {
  it.each([
    { kind: "questions", lines: ["? Who rang the bell", "? Why is the well dry", "? Where is the ferryman", "? What does the mark mean"] },
    { kind: "quests", lines: ["! Find the caravan", "! Guard the mill", "! Burn the map", "! Escort the miller"] },
    { kind: "coin and item lines together", lines: ["$ 5 gp found", "$ [[Mira]] Rope", "$ Paid 2 gp for rooms", "$ [[Mira]] Silvered lantern"] },
  ])("shows only the three last written of four $kind", ({ lines }) => {
    const latest = sessionOf(1, lines);
    const campaign = buildCampaign([latest]);
    const shown = latestOfEachKind(kindsWrittenIn(latest.path, campaign, summariseFunds(campaign).ledger));
    expect(shown.map((line) => line.source.line)).toEqual([3, 2, 1]);
  });

  it("keeps three of each kind side by side, the last written first, while every line still counts", () => {
    const lines = ["? Who rang the bell", "! Find the caravan", "$ 5 gp found", "? Why is the well dry", "! Guard the mill", "$ [[Mira]] Rope", "? Where is the ferryman", "! Burn the map", "$ Paid 2 gp for rooms", "? What does the mark mean", "! Escort the miller", "$ [[Mira]] Silvered lantern"];
    const latest = sessionOf(1, lines);
    const campaign = buildCampaign([latest]);
    const ledger = summariseFunds(campaign).ledger;
    expect(latestOfEachKind(kindsWrittenIn(latest.path, campaign, ledger)).map((line) => line.source.line)).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3]);
    expect(linesWrittenIn(latest.path, campaign, ledger)).toHaveLength(12);
  });

  it("shows nothing from another session", () => {
    const earlier = sessionOf(1, ["? Who rang the bell", "! Find the caravan", "$ 5 gp found"]);
    const latest = sessionOf(2, ["notes"]);
    const campaign = buildCampaign([earlier, latest]);
    expect(latestOfEachKind(kindsWrittenIn(latest.path, campaign, summariseFunds(campaign).ledger))).toEqual([]);
  });
});
