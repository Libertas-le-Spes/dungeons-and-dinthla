import { describe, expect, it } from "vitest";
import { formatMoney, readLedgerEntry } from "../../src/notes/ledger";

describe("readLedgerEntry", () => {
  it("reads coin coming in, in every kind of coin", () => {
    expect(readLedgerEntry("35 gp 4 sp from the bandits at the ford")).toEqual({
      type: "coin",
      coins: [
        { count: 35, kind: "gp" },
        { count: 4, kind: "sp" },
      ],
      copper: 3540,
      moneyOut: false,
    });
    expect(readLedgerEntry("1 pp 1 ep 1 cp")).toMatchObject({ copper: 1051 });
  });

  it("counts a minus sign as money out", () => {
    expect(readLedgerEntry("-12 gp ferry")).toMatchObject({ copper: -1200, moneyOut: true });
    expect(readLedgerEntry("−3 sp ale")).toMatchObject({ copper: -30, moneyOut: true });
  });

  it("counts paid, spent, bought, gave and lost as money out", () => {
    for (const word of ["Paid", "spent", "bought", "gave", "lost"]) {
      expect(readLedgerEntry(`${word} 5 gp`)).toMatchObject({ copper: -500, moneyOut: true });
    }
  });

  it("reads thousands written with commas", () => {
    expect(readLedgerEntry("1,200 gp hoard")).toMatchObject({ copper: 120000 });
  });

  it("reads a line without an amount as an item held by the first linked name", () => {
    expect(readLedgerEntry("[[Mira]] Flame Tongue")).toEqual({ type: "item", item: "Flame Tongue", holder: "Mira" });
  });

  it("reads an item nobody holds yet", () => {
    expect(readLedgerEntry("Potion of healing")).toEqual({ type: "item", item: "Potion of healing", holder: "" });
  });
});

describe("formatMoney", () => {
  it("writes copper as gold, silver and copper", () => {
    expect(formatMoney(3540)).toBe("35 gp 4 sp");
    expect(formatMoney(123456)).toBe("1,234 gp 5 sp 6 cp");
  });

  it("writes money out with a minus sign", () => {
    expect(formatMoney(-1200)).toBe("−12 gp");
  });

  it("writes nothing as 0 gp", () => {
    expect(formatMoney(0)).toBe("0 gp");
  });
});
