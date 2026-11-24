import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { whoseFunds } from "../../../src/funds/page/whose-funds";
import { HOLDER_CHANGES_IT, HOLDER_NOT_LINKABLE, readHeldCoinDraft, WORDS_SAY_OUT, type CoinDraft, type CoinHolder, type CoinReading } from "../../../src/notes/writing/coin-lines";

const MIRA: CoinHolder = { linktext: "Mira", name: "Mira" };

function draft(direction: CoinDraft["direction"], amount: string, what = ""): CoinDraft {
  return { direction, amount, what };
}

function lineOf(reading: CoinReading): string {
  if (!("line" in reading)) throw new Error(`refused: ${reading.error}`);
  return reading.line;
}

function sidesOf(line: string, ownNames: string[]): { mine: number; party: number } {
  const campaign = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: line }]);
  const funds = whoseFunds({ campaign, ownNames });
  return { mine: funds.mine.ledger.length, party: funds.party.ledger.length };
}

describe("readHeldCoinDraft", () => {
  it.each([
    { given: draft("in", "30 gp", "from the bandits"), line: "$ [[Mira]] 30 gp from the bandits", copper: 3000, reads: "Reads as In 30 gp for Mira: 30 gp from the bandits" },
    { given: draft("out", "2 gp", "for rooms"), line: "$ [[Mira]] Paid 2 gp for rooms", copper: -200, reads: "Reads as Out 2 gp for Mira: Paid 2 gp for rooms" },
  ])("writes $line with the character's link first, saying whose it is", ({ given, line, copper, reads }) => {
    expect(readHeldCoinDraft(given, MIRA)).toEqual({ line, copper, reads });
  });

  it.each([
    { holder: MIRA, line: "$ [[Mira]] 30 gp from the bandits" },
    { holder: { linktext: "Pale Moon/Characters/Mira", name: "Mira" }, line: "$ [[Pale Moon/Characters/Mira]] 30 gp from the bandits" },
  ])("puts $line on Mine and not on Party", ({ holder, line }) => {
    const written = lineOf(readHeldCoinDraft(draft("in", "30 gp", "from the bandits"), holder));
    expect(written).toBe(line);
    expect(sidesOf(written, ["Mira"])).toEqual({ mine: 1, party: 0 });
  });

  it.each(["Mi]ra", "Mi[ra", "Mi|ra", "Mi#ra", "Mi^ra", "Mi\nra"])("refuses a note name that can't be a link, like %j", (linktext) => {
    expect(readHeldCoinDraft(draft("in", "30 gp", "found"), { linktext, name: linktext })).toEqual({ error: HOLDER_NOT_LINKABLE });
  });

  it.each(["Bard 5 gp", "Mira, paid 2 gp"])("refuses a note name that would change the amount, like %s", (linktext) => {
    expect(readHeldCoinDraft(draft("in", "30 gp", "found"), { linktext, name: linktext })).toEqual({ error: HOLDER_CHANGES_IT });
  });

  it("refuses what the party's coin refuses", () => {
    expect(readHeldCoinDraft(draft("in", "5 gp", "paid the toll"), MIRA)).toEqual({ error: WORDS_SAY_OUT });
  });
});
