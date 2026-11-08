import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { ItemModal } from "../../src/funds/item-modal";
import { GONE_LINE_SAYS_MORE, HOLDER_OF_GONE, initialItemEdit, type ItemEdit } from "../../src/funds/item-plan";
import { Notice } from "../stubs/obsidian";
import { obsidianDocument } from "../views/obsidian-dom";

function openDialog(save: (edit: ItemEdit) => Promise<boolean>) {
  const campaign = buildCampaign([sessionNoteOf("Pale Moon/Sessions/Session 1.md", 1, "$ Rope\n$$ Rope :lost in the river\n")]);
  const item = campaign.items[0]!;
  const openNote = vi.fn();
  const onClosed = vi.fn();
  const holders = [{ text: "the party", label: "The party" }];
  const dialog = new ItemModal({} as App, item, initialItemEdit(item, campaign.coins), holders, "Session 2", save, openNote, onClosed);
  dialog.contentEl = obsidianDocument().createElement("div");
  dialog.open();
  const button = (text: string) => Array.from(dialog.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { openNote, onClosed, button };
}

describe("the item dialog", () => {
  it("offers to open the note when it refuses because the line says more than it writes", async () => {
    const { openNote, onClosed, button } = openDialog(() => Promise.reject(new Error(GONE_LINE_SAYS_MORE)));
    expect(button("Open note").hidden).toBe(true);
    button("Save").click();
    await vi.waitFor(() => expect(button("Open note").hidden).toBe(false));
    expect(Notice.shown.at(-1)).toBe(`Couldn't change the item: ${GONE_LINE_SAYS_MORE}`);
    expect(onClosed).not.toHaveBeenCalled();
    button("Open note").click();
    expect(onClosed).toHaveBeenCalledWith(false);
    expect(openNote).toHaveBeenCalledTimes(1);
  });

  it("doesn't offer the note for a refusal the dialog itself can fix", async () => {
    const { button } = openDialog(() => Promise.reject(new Error(HOLDER_OF_GONE)));
    button("Save").click();
    await vi.waitFor(() => expect(Notice.shown.at(-1)).toBe(`Couldn't change the item: ${HOLDER_OF_GONE}`));
    expect(button("Open note").hidden).toBe(true);
  });
});
