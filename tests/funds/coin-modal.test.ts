import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { CANNOT_SHOW, type CoinEntryChoices } from "../../src/funds/coin-entry";
import { CoinModal } from "../../src/funds/coin-modal";
import { obsidianDocument } from "../views/obsidian-dom";

function openDialog(cannotSave: string | null) {
  const entry: CoinEntryChoices = { draft: { direction: "out", amount: "2 gp", what: "rope" }, cannotSave, delete: vi.fn() };
  const openNote = vi.fn();
  const onClosed = vi.fn();
  const dialog = new CoinModal({} as App, "Session 1", vi.fn(), entry, openNote, onClosed);
  dialog.contentEl = obsidianDocument().createElement("div");
  dialog.open();
  const buttons = Array.from(dialog.contentEl.querySelectorAll("button")).map((button) => button.textContent);
  const button = (text: string) => Array.from(dialog.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { openNote, onClosed, buttons, button };
}

describe("the ledger entry dialog", () => {
  it("offers to open the note for an entry it can't save as written", () => {
    const { openNote, onClosed, buttons, button } = openDialog(CANNOT_SHOW);
    expect(buttons).toEqual(["Save", "Cancel", "Open note", "Delete entry"]);
    button("Open note").click();
    expect(onClosed).toHaveBeenCalledWith("unchanged");
    expect(openNote).toHaveBeenCalledTimes(1);
  });

  it("doesn't offer the note for an entry it can save", () => {
    expect(openDialog(null).buttons).toEqual(["Save", "Cancel", "Delete entry"]);
  });
});
