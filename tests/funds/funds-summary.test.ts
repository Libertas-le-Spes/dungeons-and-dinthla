import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { summariseFunds } from "../../src/funds/funds-summary";

function summaryOf(lines: string[]) {
  return summariseFunds(buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]));
}

describe("summariseFunds", () => {
  const summary = summaryOf([
    "$ +50 gp advance from Lady Vess",
    "$ Paid 2 gp for rooms",
    "$ 35 gp 4 sp from the bandits",
    "$ Bought rope for 2 gp, -5 gp ferry",
    "$ Potion of healing",
  ]);

  it("adds up the purse, the money in and the money out, by hand-checked sums", () => {
    expect(summary.purse).toBe(5000 - 200 + 3540 - 700);
    expect(summary.totalIn).toBe(5000 + 3540);
    expect(summary.totalOut).toBe(200 + 700);
  });

  it("lists the ledger newest first, each line with the balance after it", () => {
    expect(summary.ledger.map(({ record, balance }) => [record.text, balance])).toEqual([
      ["Bought rope for 2 gp, -5 gp ferry", 7640],
      ["35 gp 4 sp from the bandits", 8340],
      ["Paid 2 gp for rooms", 4800],
      ["+50 gp advance from Lady Vess", 5000],
    ]);
  });

  it("counts the coins the purse is made of, kind by kind, most valuable first", () => {
    expect(summary.coinCounts).toEqual([
      { kind: "gp", count: 50 - 2 + 35 - 2 - 5 },
      { kind: "sp", count: 4 },
    ]);
  });

  it("counts an entry with money in and out as in or out by its net amount", () => {
    expect(summaryOf(["$ +50 gp reward, -5 gp ferry"])).toMatchObject({ totalIn: 4500, totalOut: 0, purse: 4500 });
  });

  it("counts the coins of such an entry by each amount's own sign", () => {
    expect(summaryOf(["$ +50 gp reward, -5 gp ferry"]).coinCounts).toEqual([{ kind: "gp", count: 45 }]);
  });

  it("leaves out a kind of coin that comes to nothing", () => {
    expect(summaryOf(["$ 5 sp found", "$ paid 5 sp toll"]).coinCounts).toEqual([]);
  });

  it("summarises a campaign with no coin as empty", () => {
    expect(summaryOf(["$ Potion of healing"])).toEqual({ purse: 0, totalIn: 0, totalOut: 0, coinCounts: [], ledger: [] });
  });
});
