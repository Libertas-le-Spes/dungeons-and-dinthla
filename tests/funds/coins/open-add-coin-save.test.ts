import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { openAddCoin } from "../../../src/funds/coins/open-add-coin";
import { readCoinDraft, type CoinLine } from "../../../src/notes/writing/coin-lines";
import { DialogCampaign, lastDialog } from "../../campaign/dialog-campaign";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

const app = {} as App;

describe("the add coin dialog", () => {
  it("puts the line in the session note", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We rode on.\n", [TWO]: "We camped.\n" });
    openAddCoin(app, campaign.gate, campaign.store, () => undefined, null);
    const written = readCoinDraft({ direction: "in", amount: "5 gp", what: "found" });
    if ("error" in written) throw new Error(written.error);
    expect(await lastDialog<{ save(line: CoinLine): Promise<boolean> }>().save(written)).toBe(true);
    expect(campaign.texts.get(TWO)).toBe(`We camped.\n${written.line}\n`);
    expect(campaign.texts.get(ONE)).toBe("We rode on.\n");
  });
});
