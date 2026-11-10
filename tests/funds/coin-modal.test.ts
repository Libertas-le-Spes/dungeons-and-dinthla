import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { sessionNoteOf } from "../../src/campaign/session-file";
import type { CoinEntryChoices } from "../../src/funds/coin-entry";
import { CoinModal } from "../../src/funds/coin-modal";
import { openCoinEntry } from "../../src/funds/open-add-coin";
import type { Gate } from "../../src/fence/gatekeeper";
import { CONFIRM_MS } from "../../src/views/second-press";
import { Notice, openedModals } from "../stubs/obsidian";

const ONE = "Pale Moon/Sessions/Session 1.md";

function openEntryAt(line: number) {
  const sessionNotes = [sessionNoteOf(ONE, 1, "$ Bought rope for 2 gp\n$ 2 gp tip\n$ Rope\n$$ Rope :sold 3 gp\n")];
  const store = { current: buildCampaign(sessionNotes), sessionNotes } as unknown as CampaignStore;
  const openNote = vi.fn();
  const onClosed = vi.fn();
  const before = openedModals.length;
  openCoinEntry({} as App, { files: {} } as unknown as Gate, store, { path: ONE, line }, openNote, onClosed);
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

function openDialog(canDelete: boolean, deleteNote: () => Promise<boolean> = async () => true) {
  const entry = { draft: { direction: "in" as const, amount: "2 gp", what: "tip" }, cannotSave: null, delete: vi.fn(deleteNote) };
  let shown: CoinEntryChoices | null = null;
  if (canDelete) shown = entry;
  const onClosed = vi.fn();
  const modal = new CoinModal({} as App, "Session 1", vi.fn(async () => true), shown, null, onClosed);
  modal.open();
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  return { button, entry, onClosed };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("deleting a ledger entry", () => {
  it("deletes only on a second press, then closes", async () => {
    const { button, entry, onClosed } = openDialog(true);
    button("Delete entry")!.click();
    expect(entry.delete).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledWith("deleted"));
    expect(entry.delete).toHaveBeenCalledOnce();
  });

  it("asks again when the second press comes too late", () => {
    vi.useFakeTimers();
    const { button, entry } = openDialog(true);
    button("Delete entry")!.click();
    vi.advanceTimersByTime(CONFIRM_MS);
    button("Delete entry")!.click();
    expect(entry.delete).not.toHaveBeenCalled();
  });

  it("stops asking to delete once closed", () => {
    vi.useFakeTimers();
    const { button } = openDialog(true);
    const deleting = button("Delete entry")!;
    deleting.click();
    button("Cancel")!.click();
    expect(deleting.textContent).toBe("Delete entry");
  });

  it("needs two presses again after a failed delete", async () => {
    Notice.shown = [];
    const { button, entry, onClosed } = openDialog(true, async () => {
      throw new Error("the disk is full");
    });
    const deleting = button("Delete entry")!;
    deleting.click();
    deleting.click();
    await vi.waitFor(() => expect(Notice.shown).toEqual(["Couldn't change the entry: the disk is full"]));
    deleting.click();
    expect(entry.delete).toHaveBeenCalledOnce();
    deleting.click();
    expect(entry.delete).toHaveBeenCalledTimes(2);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("closes Add coin, which has nothing to delete", () => {
    const { button, onClosed } = openDialog(false);
    expect(button("Delete entry")).toBeUndefined();
    button("Cancel")!.click();
    expect(onClosed).toHaveBeenCalledWith("unchanged");
  });
});
