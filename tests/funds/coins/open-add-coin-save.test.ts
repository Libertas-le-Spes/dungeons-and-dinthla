import { describe, expect, it } from "vitest";
import { NO_CHARACTER_IN_PLAY, openAddCoin } from "../../../src/funds/coins/open-add-coin";
import type { CoinDialog } from "../../../src/funds/coins/coin-dialog";
import { Notice, openedModals } from "../../stubs/obsidian";
import { readCoinDraft, type CoinLine } from "../../../src/notes/writing/coin-lines";
import { DialogCampaign, lastDialog, lastFrame, SESSION_TWO_LOST } from "../../campaign/dialog-campaign";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";
import { MineSide, PARTY_SIDE } from "../../../src/funds/coins/coin-sides";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const MIRA = "Pale Moon/Characters/Mira.md";

function partyCoinOf(campaign: DialogCampaign) {
  return { showing: OBSIDIAN_SHOWING, notes: campaign.gate.notes.store, links: campaign.gate.notes.links, store: campaign.store, syntax: STUB_SYNTAX };
}

describe("the add coin dialog", () => {
  it("puts the line in the session note", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We rode on.\n", [TWO]: "We camped.\n" });
    openAddCoin(partyCoinOf(campaign), PARTY_SIDE, () => undefined, null);
    const written = readCoinDraft({ direction: "in", amount: "5 gp", what: "found" });
    if ("error" in written) throw new Error(written.error);
    expect(await lastDialog<{ save(line: CoinLine): Promise<boolean> }>().save(written)).toBe(true);
    expect(campaign.texts.get(TWO)).toBe(`We camped.\n${written.line}\n`);
    expect(campaign.texts.get(ONE)).toBe("We rode on.\n");
  });
});

describe("the add coin dialog, when the session it writes into is gone", () => {
  it.each(SESSION_TWO_LOST)("refuses with the session gone words, writing nothing when its session was %s", async (_how, lost) => {
    const campaign = new DialogCampaign({ [ONE]: "We rode on.\n", [TWO]: "We camped.\n" });
    openAddCoin(partyCoinOf(campaign), PARTY_SIDE, () => undefined, null);
    lost(campaign);
    const written = readCoinDraft({ direction: "in", amount: "5 gp", what: "found" });
    if ("error" in written) throw new Error(written.error);
    await expect(lastDialog<{ save(line: CoinLine): Promise<boolean> }>().save(written)).rejects.toThrow("Session 2 was moved or deleted, so nothing was written.");
    expect(campaign.writes).toBe(0);
    expect(campaign.texts.get(ONE)).toBe("We rode on.\n");
  });
});

describe("the add coin dialog on Mine", () => {
  it("writes the line for the character in play, linked from the session", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We rode on.\n", [TWO]: "We camped.\n", [MIRA]: "" });
    openAddCoin(partyCoinOf(campaign), new MineSide(() => campaign.gate.notes.store.note(MIRA)), () => undefined, null);
    expect(lastFrame().contentEl.querySelector(".dd-where")?.textContent).toBe("Adds a line for Mira to Session 2.");
    const amount = lastFrame().contentEl.querySelector<HTMLInputElement>('input[aria-label="Amount"]')!;
    amount.value = "5 gp";
    amount.dispatchEvent(new (amount.ownerDocument.defaultView!).Event("input"));
    lastFrame().contentEl.querySelector<HTMLButtonElement>("button.mod-cta")!.click();
    await lastDialog<CoinDialog>().settled();
    expect(campaign.texts.get(TWO)).toBe("We camped.\n$ [[Mira]] 5 gp\n");
  });

  it("says to name a character first, and opens nothing, when none of yours is in play", () => {
    Notice.shown = [];
    const campaign = new DialogCampaign({ [ONE]: "We rode on.\n", [TWO]: "We camped.\n" });
    const framesBefore = openedModals.length;
    openAddCoin(partyCoinOf(campaign), new MineSide(() => null), () => undefined, null);
    expect(Notice.shown).toEqual([NO_CHARACTER_IN_PLAY]);
    expect(openedModals).toHaveLength(framesBefore);
    expect(campaign.writes).toBe(0);
  });
});

