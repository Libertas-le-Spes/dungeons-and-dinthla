import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { minePurseOf } from "../../../src/funds/purses/mine-purse";
import type { OwnSheet } from "../../../src/funds/purses/own-characters";
import { formatMoney } from "../../../src/notes/parts/money";

function campaignOf(...sessions: string[][]) {
  return buildCampaign(sessions.map((lines, index) => ({ path: `Pale Moon/Sessions/Session ${index + 1}.md`, number: index + 1, firstLine: 0, text: lines.join("\n") })));
}

interface GoldSheet {
  name: string;
  gold: number;
  importedSession: number | null;
}

function sheetOf({ name, gold, importedSession }: GoldSheet): OwnSheet {
  return { name, purse: [{ coin: "gp", count: gold }], importedSession };
}

function noSheetOf(name: string): OwnSheet {
  return { name, purse: null, importedSession: null };
}

function purseOf(campaign: ReturnType<typeof campaignOf>, sheets: OwnSheet[]): string {
  return formatMoney(minePurseOf({ campaign, sheets }).purse);
}

describe("the purse of his character", () => {
  it("is the sheet's purse when no own line came after it", () => {
    expect(purseOf(campaignOf(["$ 5 gp from [[Mira]]"]), [sheetOf({ name: "Mira", gold: 19, importedSession: 1 })])).toBe("19 gp");
  });

  it("adds the own lines of the sessions after the one the sheet was imported in", () => {
    const campaign = campaignOf(["$ 100 gp from [[Mira]]"], ["$ 5 gp from [[Mira]]", "$ -2 gp for rope, [[Mira]]"], ["$ 1 gp from [[Mira]]"]);
    expect(purseOf(campaign, [sheetOf({ name: "Mira", gold: 19, importedSession: 1 })])).toBe("23 gp");
  });

  it("counts a line only once when the sheet is updated after more sessions", () => {
    const campaign = campaignOf(["$ 5 gp from [[Mira]]"], ["$ 7 gp from [[Mira]]"], ["$ 1 gp from [[Mira]]"]);
    expect(purseOf(campaign, [sheetOf({ name: "Mira", gold: 19, importedSession: 1 })])).toBe("27 gp");
    expect(purseOf(campaign, [sheetOf({ name: "Mira", gold: 31, importedSession: 2 })])).toBe("32 gp");
    expect(purseOf(campaign, [sheetOf({ name: "Mira", gold: 31, importedSession: 3 })])).toBe("31 gp");
  });

  it("counts every own line for a character with no sheet purse, starting at 0 gp", () => {
    expect(purseOf(campaignOf(["$ 5 gp from [[Mira]]"], ["$ 7 gp from [[Mira]]"]), [noSheetOf("Mira")])).toBe("12 gp");
    expect(purseOf(campaignOf([]), [noSheetOf("Mira")])).toBe("0 gp");
  });

  it("counts no line of a character whose sheet purse has no session recorded", () => {
    expect(purseOf(campaignOf(["$ 5 gp from [[Mira]]"], ["$ 7 gp from [[Mira]]"]), [sheetOf({ name: "Mira", gold: 19, importedSession: null })])).toBe("19 gp");
  });

  it("counts the sheet's session 0 as before every session", () => {
    expect(purseOf(campaignOf(["$ 5 gp from [[Mira]]"]), [sheetOf({ name: "Mira", gold: 19, importedSession: 0 })])).toBe("24 gp");
  });

  it("adds up several own characters, each from its own session", () => {
    const campaign = campaignOf(["$ 5 gp from [[Mira]]", "$ 3 gp from [[Bo]]"], ["$ 7 gp from [[Mira]]", "$ -1 gp, [[Bo]]"]);
    expect(purseOf(campaign, [sheetOf({ name: "Mira", gold: 10, importedSession: 1 }), sheetOf({ name: "Bo", gold: 20, importedSession: 2 }), noSheetOf("Cy")])).toBe("37 gp");
  });

  it("counts a line of a character with no sheet next to one that has", () => {
    const campaign = campaignOf(["$ 5 gp from [[Mira]]", "$ 3 gp from [[Bo]]"]);
    expect(purseOf(campaign, [sheetOf({ name: "Mira", gold: 10, importedSession: 1 }), noSheetOf("Bo")])).toBe("13 gp");
  });

  it("counts the lines that sell an item to him", () => {
    const campaign = campaignOf(["$ Rope"], ["$$ Rope :sold 20 gp to [[Mira]]"]);
    expect(purseOf(campaign, [sheetOf({ name: "Mira", gold: 19, importedSession: 1 })])).toBe("39 gp");
  });

  it("matches the link whatever its capitals", () => {
    expect(purseOf(campaignOf(["$ 5 gp from [[mira]]"]), [noSheetOf("Mira")])).toBe("5 gp");
    expect(purseOf(campaignOf(["$ 5 gp from [[Characters/MIRA|her]]"]), [noSheetOf("Mira")])).toBe("5 gp");
  });

  it("leaves out the lines that link none of his characters", () => {
    expect(purseOf(campaignOf(["$ 5 gp from [[Zed]]", "$ 9 gp advance"]), [noSheetOf("Mira")])).toBe("0 gp");
  });

  it("counts a line that links two of his characters once", () => {
    expect(purseOf(campaignOf(["$ 5 gp from [[Mira]] and [[Bo]]"]), [noSheetOf("Mira"), noSheetOf("Bo")])).toBe("5 gp");
  });

  it("adds the sheet's coins to the coins of the lines, and the sheet to money in", () => {
    const sheet: OwnSheet = { name: "Mira", purse: [{ coin: "pp", count: 1 }, { coin: "gp", count: 19 }, { coin: "sp", count: null }], importedSession: 1 };
    const summary = minePurseOf({ campaign: campaignOf([], ["$ 5 gp from [[Mira]]", "$ -2 sp, [[Mira]]"]), sheets: [sheet] });
    expect(summary.coinCounts).toEqual([
      { kind: "pp", count: 1 },
      { kind: "gp", count: 24 },
      { kind: "sp", count: -2 },
    ]);
    expect(summary.totalIn).toBe(1000 + 1900 + 500);
    expect(summary.totalOut).toBe(20);
    expect(summary.purse).toBe(1000 + 1900 + 500 - 20);
  });

  it("skips a sheet coin that is not a coin", () => {
    const sheet: OwnSheet = { name: "Mira", purse: [{ coin: "xx", count: 5 }], importedSession: 1 };
    expect(purseOf(campaignOf([]), [sheet])).toBe("0 gp");
  });
});
