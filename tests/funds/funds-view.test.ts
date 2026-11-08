import { describe, expect, it, vi } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { FundsView } from "../../src/funds/funds-view";
import { obsidianDocument } from "../views/obsidian-dom";

function campaignOf(lines: string[], ...laterSessions: string[][]): Campaign {
  return buildCampaign(
    [lines, ...laterSessions].map((sessionLines, index) => ({
      path: `Pale Moon/Sessions/Session ${index + 1}.md`,
      number: index + 1,
      firstLine: 0,
      text: sessionLines.join("\n"),
    })),
  );
}

async function openView(campaign: Campaign) {
  let listener: (campaign: Campaign) => void = () => {};
  const unsubscribe = vi.fn();
  const store = {
    current: campaign,
    subscribe: (next: (campaign: Campaign) => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const actions = { openSource: vi.fn(), openLink: vi.fn() };
  const view = new FundsView({} as WorkspaceLeaf, store as unknown as CampaignStore, actions);
  const root = obsidianDocument().createElement("div");
  view.contentEl = root;
  const registered: (() => void)[] = [];
  view.register = (callback) => {
    registered.push(callback);
  };
  await view.onOpen();
  const change = (next: Campaign) => {
    store.current = next;
    listener(next);
  };
  const close = () => {
    for (const callback of registered) callback();
  };
  return { root, actions, change, close, unsubscribe };
}

function textsOf(root: HTMLElement, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

describe("FundsView", () => {
  it("shows the purse, money in and out, and the ledger newest first with each balance", async () => {
    const { root } = await openView(campaignOf(["$ +50 gp advance", "$ Paid 2 gp for rooms", "$ 35 gp 4 sp from the bandits"]));
    expect(textsOf(root, ".dd-purse")).toEqual(["83 gp 4 sp"]);
    expect(textsOf(root, ".dd-in-out > span")).toEqual(["In 85 gp 4 sp", "Out 2 gp"]);
    expect(textsOf(root, ".dd-ledger .dd-amount")).toEqual(["+35 gp 4 sp", "−2 gp", "+50 gp"]);
    expect(textsOf(root, ".dd-ledger .dd-direction")).toEqual(["In", "Out", "In"]);
    expect(textsOf(root, ".dd-ledger .dd-balance")).toEqual(["83 gp 4 sp", "48 gp", "50 gp"]);
    expect(textsOf(root, ".dd-ledger .dd-what")).toEqual(["35 gp 4 sp from the bandits", "Paid 2 gp for rooms", "+50 gp advance"]);
    expect(textsOf(root, ".dd-ledger-panel .dd-title .dd-count")).toEqual(["3 entries"]);
  });

  it("shows the coins the purse is made of when they read differently from it", async () => {
    const { root } = await openView(campaignOf(["$ 1 pp found", "$ 5 gp found"]));
    expect(textsOf(root, ".dd-coin")).toEqual(["1 pp", "5 gp"]);
  });

  it("leaves the coins out when they read the same as the purse", async () => {
    const { root } = await openView(campaignOf(["$ 35 gp 4 sp found"]));
    expect(root.querySelector(".dd-coin")).toBeNull();
  });

  it("says how to note coin when there is none", async () => {
    const { root } = await openView(campaignOf([]));
    expect(textsOf(root, ".dd-coins .dd-empty")).toEqual(["No coin yet. Note it as “$ 20 gp from …”."]);
    expect(textsOf(root, ".dd-ledger .dd-empty")).toEqual(["No coin entries yet."]);
    expect(textsOf(root, ".dd-purse")).toEqual(["0 gp"]);
    expect(textsOf(root, ".dd-ledger-panel .dd-title .dd-count")).toEqual([""]);
  });

  it("counts one entry as an entry", async () => {
    const { root } = await openView(campaignOf(["$ 5 gp"]));
    expect(textsOf(root, ".dd-ledger-panel .dd-title .dd-count")).toEqual(["1 entry"]);
  });

  it("writes large coin counts as the purse does, so they aren't shown twice", async () => {
    const { root } = await openView(campaignOf(["$ 1200 gp from the dragon"]));
    expect(textsOf(root, ".dd-purse")).toEqual(["1,200 gp"]);
    expect(root.querySelector(".dd-coin")).toBeNull();
  });

  it("labels the coins the purse is made of", async () => {
    const { root } = await openView(campaignOf(["$ 1 pp found", "$ 5 gp found"]));
    expect(textsOf(root, ".dd-coins-label")).toEqual(["In coins:"]);
  });

  it("redraws when notes change, and stops listening when closed", async () => {
    const { root, change, close, unsubscribe } = await openView(campaignOf([]));
    change(campaignOf(["$ 5 gp found"]));
    expect(textsOf(root, ".dd-purse")).toEqual(["5 gp"]);
    close();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("opens the session at a ledger line when it is tapped", async () => {
    const { root, actions } = await openView(campaignOf(["We rode on.", "$ 5 gp"]));
    (root.querySelector(".dd-ledger-row") as HTMLElement).click();
    expect(actions.openSource).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 });
  });

  it("writes an entry that comes to nothing without a sign", async () => {
    const { root } = await openView(campaignOf(["$ found 5 gp, paid 5 gp toll"]));
    expect(textsOf(root, ".dd-ledger .dd-amount")).toEqual(["0 gp"]);
  });

  it("lists held items under their holders, the party's own last, with gone items folded away", async () => {
    const { root } = await openView(campaignOf(["$ [[Mira]] Flame Tongue", "$ Potion of healing", "$ Spyglass", "$ Rope"], ["$$ Spyglass :sold 20 gp", "$$ Rope :used"]));
    expect(textsOf(root, ".dd-items-panel .dd-holder")).toEqual(["Mira", "The party"]);
    expect(textsOf(root, ".dd-items-panel > .dd-list .dd-text")).toEqual(["Flame Tongue", "Potion of healing"]);
    expect(textsOf(root, ".dd-items-panel > .dd-list .dd-mark-ledger")).toEqual(["$", "$"]);
    expect(textsOf(root, ".dd-items-panel > .dd-title .dd-count")).toEqual(["2 held"]);
    expect(textsOf(root, ".dd-items-panel .dd-folded summary")).toEqual(["Gone2"]);
    expect(root.querySelectorAll(".dd-folded .dd-text.dd-gone")).toHaveLength(2);
  });

  it("says how and in which session each item went, and when its sale is in the ledger", async () => {
    const { root } = await openView(campaignOf(["$ Spyglass", "$ Rope", "$ Map"], ["$$ Spyglass :sold 20 gp", "$$ Map :sold", "$$ Rope :used"]));
    expect(textsOf(root, ".dd-folded .dd-meta")).toEqual([
      "Used up · Session 2",
      "Sold · Session 2",
      "Sold · sale in the ledger · Session 2",
    ]);
    expect(Array.from(root.querySelectorAll(".dd-folded .dd-mark-gone")).map((mark) => mark.getAttribute("aria-label"))).toEqual([
      "Used up",
      "Sold",
      "Sold",
    ]);
  });

  it("opens a held item where it was written, and a gone one where it went", async () => {
    const { root, actions } = await openView(campaignOf(["$ Potion of healing", "$ Rope"], ["We rode on.", "$$ Rope :used"]));
    (root.querySelector(".dd-items-panel > .dd-list .dd-row") as HTMLElement).click();
    expect(actions.openSource).toHaveBeenLastCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 0 });
    (root.querySelector(".dd-folded .dd-row") as HTMLElement).click();
    expect(actions.openSource).toHaveBeenLastCalledWith({ path: "Pale Moon/Sessions/Session 2.md", line: 1 });
  });

  it("says how to note an item, and that nothing is gone, when there are none", async () => {
    const { root } = await openView(campaignOf(["$ 5 gp"]));
    expect(textsOf(root, ".dd-items-panel > .dd-empty")).toEqual([
      "No items held. A $ line without an amount, like “$ [[Mira]] Flame Tongue longsword”, adds one.",
    ]);
    expect(textsOf(root, ".dd-folded .dd-empty")).toEqual(["Nothing sold, used or lost yet."]);
    expect(textsOf(root, ".dd-items-panel > .dd-title .dd-count")).toEqual([""]);
  });

  it("opens a holder's note when their name is tapped", async () => {
    const { root, actions } = await openView(campaignOf(["$ [[Mira]] Flame Tongue"]));
    (root.querySelector(".dd-holder a.internal-link") as HTMLElement).click();
    expect(actions.openLink).toHaveBeenCalledWith("Mira", "Pale Moon/Sessions/Session 1.md");
  });
});
