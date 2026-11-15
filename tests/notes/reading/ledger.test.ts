import { describe, expect, it } from "vitest";
import { readLedgerEntry } from "../../../src/notes/reading/ledger";

describe("readLedgerEntry", () => {
  it("reads coin coming in", () => {
    expect(readLedgerEntry("35 gp 4 sp from the bandits at the ford")).toEqual({
      type: "coin",
      coins: [
        { count: 35, kind: "gp", moneyOut: false },
        { count: 4, kind: "sp", moneyOut: false },
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

  it("signs each amount on its own", () => {
    expect(readLedgerEntry("+50 gp reward, -5 gp ferry")).toMatchObject({ copper: 4500, moneyOut: false });
  });

  it("counts a money-out word for every amount after it up to the next comma", () => {
    expect(readLedgerEntry("paid 5 gp, got 3 gp back")).toMatchObject({ copper: -200, moneyOut: true });
    expect(readLedgerEntry("Bought rope for 2 gp")).toMatchObject({ copper: -200 });
    expect(readLedgerEntry("Paid the ferryman 5 gp 3 sp")).toMatchObject({ copper: -530 });
  });

  it("doesn't count a money-out word for amounts before it", () => {
    expect(readLedgerEntry("found 10 gp, paid 4 gp")).toMatchObject({ copper: 600, moneyOut: false });
    expect(readLedgerEntry("10 gp found and lost")).toMatchObject({ copper: 1000 });
  });

  it("lets a sign win over a money-out word", () => {
    expect(readLedgerEntry("[[Lady Vess]] gave us 50 gp")).toMatchObject({ copper: -5000 });
    expect(readLedgerEntry("[[Lady Vess]] gave us +50 gp")).toMatchObject({ copper: 5000, moneyOut: false });
  });

  it("reads an amount written straight after a comma", () => {
    expect(readLedgerEntry("10 gp,5 gp")).toMatchObject({ copper: 1500 });
  });

  it("reads money out and back in that cancel out as no money out", () => {
    expect(readLedgerEntry("paid 5 gp, got 5 gp back")).toMatchObject({ copper: 0, moneyOut: false });
  });

  it("doesn't count a money-out word inside a linked name", () => {
    expect(readLedgerEntry("reward from [[Lost Hollow]] 5 gp")).toMatchObject({ copper: 500, moneyOut: false });
  });

  it("keeps an amount written with a thousands comma whole when paid out", () => {
    expect(readLedgerEntry("paid 1,200 gp")).toMatchObject({ copper: -120000 });
  });

  it("only counts those words as whole words", () => {
    expect(readLedgerEntry("Paidcash 5 gp")).toMatchObject({ copper: 500, moneyOut: false });
  });

  it("reads thousands written with commas", () => {
    expect(readLedgerEntry("1,200 gp hoard")).toMatchObject({ copper: 120000 });
  });

  it("doesn't read an amount inside a word as coin", () => {
    expect(readLedgerEntry("x5 gp token")).toEqual({ type: "item", item: "x5 gp token", holder: "", links: [] });
    expect(readLedgerEntry("5 gpx")).toEqual({ type: "item", item: "5 gpx", holder: "", links: [] });
  });

  it("reads a line without an amount as an item held by the first linked name", () => {
    expect(readLedgerEntry("[[Mira]] gave [[Tor]] the axe")).toEqual({
      type: "item",
      item: "gave [[Tor]] the axe",
      holder: "Mira",
      links: ["Mira", "Tor"],
    });
  });

  it("reads the holder of a link with a shown name", () => {
    expect(readLedgerEntry("[[Mira Thorne|Mira]] Flame Tongue")).toEqual({ type: "item", item: "Flame Tongue", holder: "Mira Thorne", links: ["Mira Thorne"] });
  });

  it("reads an item nobody holds yet, with its spaces tidied", () => {
    expect(readLedgerEntry("Potion   of healing")).toEqual({ type: "item", item: "Potion of healing", holder: "", links: [] });
  });

  it("leaves a trailing block id out of an item's name", () => {
    expect(readLedgerEntry("Rope ^r1")).toEqual({ type: "item", item: "Rope", holder: "", links: [] });
    expect(readLedgerEntry("[[Mira]] Silvered lantern ^lantern-1 ")).toEqual({ type: "item", item: "Silvered lantern", holder: "Mira", links: ["Mira"] });
    expect(readLedgerEntry("Rope ^r1 and hook")).toEqual({ type: "item", item: "Rope ^r1 and hook", holder: "", links: [] });
    expect(readLedgerEntry("Rope^r1")).toEqual({ type: "item", item: "Rope^r1", holder: "", links: [] });
  });

  it("reads a block id alone as no item", () => {
    expect(readLedgerEntry("^r1")).toBeNull();
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
    readLedgerEntry(`paid${",".repeat(100_000)} 5 gp`);
    readLedgerEntry(`paid ${"[[a,".repeat(100_000)} 5 gp`);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it("signs each amount on its own", () => {
    expect(readLedgerEntry("+50 gp reward, -5 gp ferry")).toMatchObject({
      coins: [
        { count: 50, kind: "gp", moneyOut: false },
        { count: 5, kind: "gp", moneyOut: true },
      ],
      copper: 4500,
    });
  });

  it("keeps every link of an item line", () => {
    expect(readLedgerEntry("[[Zed]] gave a rope to [[Mira]]")).toMatchObject({ holder: "Zed", links: ["Zed", "Mira"] });
  });
});
