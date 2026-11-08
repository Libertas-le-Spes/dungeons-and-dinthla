import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import {
  draftOf,
  NO_AMOUNT,
  NO_COIN,
  NO_FOR,
  readCoinDraft,
  SIGN_SAYS_IN,
  SIGN_SAYS_OUT,
  WORDS_CHANGE_IT,
  WORDS_SAY_OUT,
  type CoinDraft,
} from "../../src/notes/coin-lines";

function purseAfter(line: string): number {
  return buildCampaign([{ path: "S/Sessions/Session 1.md", number: 1, firstLine: 0, text: line }]).purseCopper;
}

function draft(direction: CoinDraft["direction"], amount: string, what = ""): CoinDraft {
  return { direction, amount, what };
}

function lineOf(reading: ReturnType<typeof readCoinDraft>): string {
  if (!("line" in reading)) throw new Error(`refused: ${reading.error}`);
  return reading.line;
}

describe("readCoinDraft", () => {
  it("writes money in as the amount and what it was for, read back the same", () => {
    const reading = readCoinDraft(draft("in", " 35 gp 4 sp ", "from the bandits"));
    expect(reading).toEqual({
      line: "$ 35 gp 4 sp from the bandits",
      copper: 3540,
      reads: "Reads as In 35 gp 4 sp: 35 gp 4 sp from the bandits",
    });
    expect(purseAfter(lineOf(reading))).toBe(3540);
  });

  it("writes money out as Paid, every amount counted out", () => {
    const reading = readCoinDraft(draft("out", "-2 gp 5 sp", "for rooms"));
    expect(lineOf(reading)).toBe("$ Paid 2 gp 5 sp for rooms");
    expect(purseAfter(lineOf(reading))).toBe(-250);
  });

  it("keeps a leading money word as the verb of money out", () => {
    expect(lineOf(readCoinDraft(draft("out", "5 gp", "Bought rope")))).toBe("$ Bought 5 gp rope");
  });

  it("reads grouped thousands, and refuses commas that would drop an amount", () => {
    expect(purseAfter(lineOf(readCoinDraft(draft("in", "1,200 gp 5 sp"))))).toBe(120050);
    for (const amount of ["1,200,gp 5 sp", "5, gp 3 sp", "12,50 gp", "1,,2 gp", "5 gp, 3 sp", "1234567890 gp"]) {
      expect(readCoinDraft(draft("in", amount)), amount).toEqual({ error: NO_COIN });
    }
  });

  it("asks for a coin when the amount has none", () => {
    expect(readCoinDraft(draft("in", "35"))).toEqual({ error: NO_COIN });
  });

  it("refuses an amount that comes to nothing", () => {
    expect(readCoinDraft(draft("out", "0 gp"))).toEqual({ error: NO_AMOUNT });
  });

  it("refuses a sign that says the other way", () => {
    expect(readCoinDraft(draft("in", "-5 gp", "ferry"))).toEqual({ error: SIGN_SAYS_OUT });
    expect(readCoinDraft(draft("in", "- 5 gp"))).toEqual({ error: SIGN_SAYS_OUT });
    expect(readCoinDraft(draft("out", "+5 gp"))).toEqual({ error: SIGN_SAYS_IN });
  });

  it("refuses words that say money out when In is chosen", () => {
    for (const what of ["spent on rope", "paid to the ferryman", "lost at dice"]) {
      expect(readCoinDraft(draft("in", "5 gp", what)), what).toEqual({ error: WORDS_SAY_OUT });
    }
    expect(lineOf(readCoinDraft(draft("in", "5 gp", "reward from [[Lost Hollow]]")))).toBe("$ 5 gp reward from [[Lost Hollow]]");
  });

  it("refuses for:, which would mark a quest's reward collected", () => {
    expect(readCoinDraft(draft("out", "5 gp", "refund, for: Find the caravan"))).toEqual({ error: NO_FOR });
  });

  it("refuses words that would change how the line is read", () => {
    for (const what of ["change from 10 gp", "a tip (2 sp)", "from [[Bob 3 gp]]"]) {
      expect(readCoinDraft(draft("in", "5 gp", what)), what).toEqual({ error: WORDS_CHANGE_IT });
    }
    expect(readCoinDraft(draft("out", "5 gp", "and 2 gp back"))).toEqual({ error: WORDS_CHANGE_IT });
  });
});

describe("draftOf", () => {
  it("fills the dialog back from an entry, so saving it unchanged writes the same line", () => {
    for (const line of ["35 gp 4 sp from the bandits", "Paid 2 gp 5 sp for rooms", "Bought 5 gp rope", "1,200 gp found"]) {
      const entry = buildCampaign([{ path: "S/Sessions/Session 1.md", number: 1, firstLine: 0, text: `$ ${line}` }]).coins[0]!;
      const draft = draftOf(entry.text, entry.entry.copper, entry.entry.coins);
      expect(lineOf(readCoinDraft(draft)), line).toBe(`$ ${line}`);
    }
  });
});
