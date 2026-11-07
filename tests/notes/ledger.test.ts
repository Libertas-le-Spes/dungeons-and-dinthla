import { describe, expect, it } from "vitest";
import { readLedgerEntry } from "../../src/notes/ledger";

describe("readLedgerEntry", () => {
  it("reads coin coming in", () => {
    expect(readLedgerEntry("35 gp 4 sp from the bandits at the ford")).toEqual({
      type: "coin",
      coins: [
        { count: 35, kind: "gp" },
        { count: 4, kind: "sp" },
      ],
      copper: 3540,
      moneyOut: false,
    });
  });

  it("counts every kind of coin at its worth in copper", () => {
    expect(readLedgerEntry("1 pp 1 ep 1 cp")).toMatchObject({ copper: 1051 });
  });

  it("reads coin written in capitals", () => {
    expect(readLedgerEntry("5 GP")).toMatchObject({ coins: [{ count: 5, kind: "gp" }], copper: 500 });
  });

  it("reads an amount in brackets", () => {
    expect(readLedgerEntry("ferry (5 gp)")).toMatchObject({ copper: 500 });
  });

  it("counts a minus sign as money out", () => {
    expect(readLedgerEntry("-12 gp ferry")).toMatchObject({ copper: -1200, moneyOut: true });
    expect(readLedgerEntry("− 3 sp ale")).toMatchObject({ copper: -30, moneyOut: true });
  });

  it("counts a plus sign as money in", () => {
    expect(readLedgerEntry("+5 gp found")).toMatchObject({ copper: 500, moneyOut: false });
  });

  it("counts paid, spent, bought, gave and lost as money out", () => {
    for (const word of ["Paid", "spent", "bought", "gave", "lost"]) {
      expect(readLedgerEntry(`${word} 5 gp`)).toMatchObject({ copper: -500, moneyOut: true });
    }
  });

  it("only counts those words as whole words", () => {
    expect(readLedgerEntry("Paidcash 5 gp")).toMatchObject({ copper: 500, moneyOut: false });
  });

  it("reads thousands written with commas", () => {
    expect(readLedgerEntry("1,200 gp hoard")).toMatchObject({ copper: 120000 });
  });

  it("doesn't read an amount inside a word as coin", () => {
    expect(readLedgerEntry("x5 gp token")).toEqual({ type: "item", item: "x5 gp token", holder: "" });
    expect(readLedgerEntry("5 gpx")).toEqual({ type: "item", item: "5 gpx", holder: "" });
  });

  it("reads a line without an amount as an item held by the first linked name", () => {
    expect(readLedgerEntry("[[Mira]] gave [[Tor]] the axe")).toEqual({
      type: "item",
      item: "gave [[Tor]] the axe",
      holder: "Mira",
    });
  });

  it("reads the holder of a link with a shown name", () => {
    expect(readLedgerEntry("[[Mira Thorne|Mira]] Flame Tongue")).toEqual({ type: "item", item: "Flame Tongue", holder: "Mira Thorne" });
  });

  it("reads an item nobody holds yet, with its spaces tidied", () => {
    expect(readLedgerEntry("Potion   of healing")).toEqual({ type: "item", item: "Potion of healing", holder: "" });
  });

  it("reads nothing from an empty line or a name alone", () => {
    expect(readLedgerEntry("")).toBeNull();
    expect(readLedgerEntry("   ")).toBeNull();
    expect(readLedgerEntry("[[Mira]]")).toBeNull();
  });

  it("reads a very long line quickly", () => {
    const started = performance.now();
    readLedgerEntry(`5${" ".repeat(100_000)}x`);
    readLedgerEntry(`-${" ".repeat(100_000)}x`);
    expect(performance.now() - started).toBeLessThan(200);
  });
});
