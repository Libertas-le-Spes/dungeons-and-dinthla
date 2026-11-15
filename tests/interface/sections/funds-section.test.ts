import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { FundsPage } from "../../../src/funds/page/funds-page";
import { CLOSE_ITEM, EDIT_NOTE } from "../../../src/funds/item-notes/item-panel";
import { fundsSection } from "../../../src/interface/sections/funds-section";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { FakeOwnCharacterNotes } from "../../funds/purses/fake-own-character-notes";

const LANTERN = "Pale Moon/Items/Silvered lantern.md";

function made(path: string | null) {
  const sessions = [{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "$ [[Mira]] [[Silvered lantern]]" }];
  const store = { campaignFolder: "Pale Moon", sessionNotes: sessions, current: buildCampaign(sessions), subscribe: () => () => {} };
  const texts = { read: vi.fn(async () => "Found in the cellar."), onChanged: () => () => {}, onGone: () => () => {} };
  const needs = {
    store: store as unknown as CampaignStore,
    texts,
    actions: { openRow: vi.fn(), openLink: vi.fn() },
    noteExists: () => true,
    addCoin: vi.fn(),
    openLedgerEntry: vi.fn(),
    openItem: vi.fn(),
    campaignFolders: () => ["Pale Moon"],
    ownCharacterNotes: new FakeOwnCharacterNotes(new Map(), []),
  };
  const root = obsidianDocument().createElement("div");
  const show = vi.fn();
  const page = fundsSection(needs)(root, show, path, vi.fn());
  page.load();
  const button = (text: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  return { page, root, show, button, texts };
}

describe("fundsSection", () => {
  it("makes Party funds with no item open when the tab shows no note", () => {
    const { page, root } = made(null);
    expect(page).toBeInstanceOf(FundsPage);
    expect(root.querySelector(".dd-shown-item")).toBeNull();
    expect(root.querySelectorAll(".dd-purse-panel")).toHaveLength(2);
  });

  it("opens the item of the item note the tab shows, on Party funds", async () => {
    const { root, texts } = made(LANTERN);
    expect(root.querySelector(".dd-shown-item .dd-item-name")!.textContent).toBe("Silvered lantern");
    expect(root.querySelector<HTMLElement>(".dd-row-shown")!.dataset.item).toBe("Silvered lantern");
    expect(texts.read).toHaveBeenCalledExactlyOnceWith(LANTERN);
  });

  it("opens no item for a note outside the campaign's Items folder", () => {
    expect(made("Pale Moon/Places/Silvered lantern.md").root.querySelector(".dd-shown-item")).toBeNull();
    expect(made("Gilded Stag/Items/Silvered lantern.md").root.querySelector(".dd-shown-item")).toBeNull();
  });

  it("shows the item's note on its note page to edit it, and all items when the item is closed, in the same tab", () => {
    const { button, show } = made(LANTERN);
    button(EDIT_NOTE)!.click();
    expect(show).toHaveBeenLastCalledWith({ page: "note", path: LANTERN });
    button(CLOSE_ITEM)!.click();
    expect(show).toHaveBeenLastCalledWith({ page: "funds", path: null });
    expect(show).toHaveBeenCalledTimes(2);
  });
});
