import { describe, expect, it } from "vitest";
import { readLedgerEntry } from "../../src/notes/ledger";
import { readMarker } from "../../src/notes/marker";
import { NO_COIN, readCoinDraft, WORDS_CHANGE_IT } from "../../src/notes/coin-lines";

describe("readCoinDraft", () => {
  it("writes money in as the amount and what it was for, reading back the same", () => {
    const reading = readCoinDraft({ direction: "in", amount: " 35 gp 4 sp ", what: "from the bandits" });
    expect(reading).toEqual({
      line: "$ 35 gp 4 sp from the bandits",
      copper: 3540,
      reads: "Reads as In 35 gp 4 sp: 35 gp 4 sp from the bandits",
    });
    if ("line" in reading) expect(readLedgerEntry(readMarker(reading.line).body)).toMatchObject({ copper: 3540 });
  });

  it("writes money out as Paid, every amount counted out", () => {
    expect(readCoinDraft({ direction: "out", amount: "-2 gp 5 sp", what: "for rooms" })).toMatchObject({
      line: "$ Paid 2 gp 5 sp for rooms",
      copper: -250,
      reads: "Reads as Out 2 gp 5 sp: Paid 2 gp 5 sp for rooms",
    });
  });

  it("asks for a coin when the amount has none", () => {
    expect(readCoinDraft({ direction: "in", amount: "35", what: "" })).toEqual({ error: NO_COIN });
    expect(readCoinDraft({ direction: "in", amount: "a lot of gp", what: "" })).toEqual({ error: NO_COIN });
  });

  it("refuses words that would change how the line is read", () => {
    expect(readCoinDraft({ direction: "in", amount: "5 gp", what: "change from 10 gp" })).toEqual({ error: WORDS_CHANGE_IT });
    expect(readCoinDraft({ direction: "in", amount: "5 gp", what: "and paid 2 gp back" })).toEqual({ error: WORDS_CHANGE_IT });
  });
});
