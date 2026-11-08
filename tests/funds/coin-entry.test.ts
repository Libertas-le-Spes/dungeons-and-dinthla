import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote } from "../../src/campaign/campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { CHANGES_MORE_THAN_THE_ENTRY, isLedgerLineEntry, refusalForEntryChange } from "../../src/funds/coin-entry";

function sessionsOf(text: string): SessionNote[] {
  return [sessionNoteOf("S/Sessions/Session 1.md", 1, text)];
}

describe("isLedgerLineEntry", () => {
  it("knows a $ line's entry from a sale's", () => {
    const coins = buildCampaign(sessionsOf("$ 5 gp found\n$ Lantern\n$$ Lantern :sold 30 gp")).coins;
    expect(coins.map(isLedgerLineEntry)).toEqual([true, false]);
  });
});

describe("refusalForEntryChange", () => {
  it("lets a change through when the purse moves by the difference", () => {
    const sessions = sessionsOf("$ 5 gp found\n");
    const record = buildCampaign(sessions).coins[0]!;
    expect(refusalForEntryChange(sessions, record, "$ 8 gp found", 800)).toBeNull();
    expect(refusalForEntryChange(sessions, record, null, 0)).toBeNull();
  });

  it("refuses a change that would move the purse otherwise", () => {
    const sessions = sessionsOf("$ 5 gp found\n");
    const record = buildCampaign(sessions).coins[0]!;
    expect(refusalForEntryChange(sessions, record, "$ 8 gp found, 2 gp more", 800)).toBe(CHANGES_MORE_THAN_THE_ENTRY);
  });

  it("refuses when the entry's line was changed by hand, so removing it would remove nothing", () => {
    const record = buildCampaign(sessionsOf("$ 5 gp found\n")).coins[0]!;
    expect(refusalForEntryChange(sessionsOf("$ 6 gp found\n"), record, "$ 8 gp found", 800)).toBe(CHANGES_MORE_THAN_THE_ENTRY);
  });
});
