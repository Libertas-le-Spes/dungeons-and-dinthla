import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { openCoinEntry } from "../../src/funds/open-add-coin";
import { openedModals } from "../stubs/obsidian";

const ONE = "Pale Moon/Sessions/Session 1.md";

function openEntryAt(line: number) {
  const sessionNotes = [sessionNoteOf(ONE, 1, "$ Bought rope for 2 gp\n$ 2 gp tip\n$ Rope\n$$ Rope :sold 3 gp\n")];
  const store = { current: buildCampaign(sessionNotes), sessionNotes } as unknown as CampaignStore;
  const openNote = vi.fn();
  const onClosed = vi.fn();
  const before = openedModals.length;
  openCoinEntry({ vault: {} } as App, store, { path: ONE, line }, openNote, onClosed);
  const opened = openedModals.slice(before);
  const buttons = opened.flatMap((dialog) => Array.from(dialog.contentEl.querySelectorAll("button")));
  const button = (text: string) => buttons.find((candidate) => candidate.textContent === text)!;
  return { openNote, onClosed, opened, names: buttons.map((candidate) => candidate.textContent), button };
}

describe("the ledger entry dialog", () => {
  it("offers to open the note for an entry it can't save as written", () => {
    const { openNote, onClosed, names, button } = openEntryAt(0);
    expect(names).toEqual(["Save", "Cancel", "Open note", "Delete entry"]);
    button("Open note").click();
    expect(onClosed).toHaveBeenCalledWith("unchanged");
    expect(openNote).toHaveBeenCalledTimes(1);
  });

  it("doesn't offer the note for an entry it can save", () => {
    expect(openEntryAt(1).names).toEqual(["Save", "Cancel", "Delete entry"]);
  });

  it("opens the note for a sale it is asked to open", () => {
    const { openNote, opened } = openEntryAt(3);
    expect(opened).toEqual([]);
    expect(openNote).toHaveBeenCalledTimes(1);
  });
});
