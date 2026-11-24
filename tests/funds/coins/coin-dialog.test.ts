import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import type { CoinEntryChoices } from "../../../src/funds/coins/coin-entry";
import { CoinDialog } from "../../../src/funds/coins/coin-dialog";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";
import { ModalFrame } from "../../../src/obsidian/views/frames/modal-frame";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";
import type { CoinNotes } from "../../../src/funds/coins/open-add-coin";
import { openCoinEntry } from "../../../src/funds/coins/open-add-coin";
import { CONFIRM_MS } from "../../../src/views/dialogs/second-press";
import { Notice, openedModals } from "../../stubs/obsidian";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { MountedView } from "../../host/showing/mounted-view";
import { readCoinDraft, type CoinDraft, type CoinLine } from "../../../src/notes/writing/coin-lines";

const ONE = "Pale Moon/Sessions/Session 1.md";

function openEntryAt(line: number) {
  const sessionNotes = [sessionNoteOf(ONE, 1, "$ Bought rope for 2 gp\n$ 2 gp tip\n$ Rope\n$$ Rope :sold 3 gp\n", STUB_SYNTAX)];
  const store = { current: buildCampaign(sessionNotes), sessionNotes } as unknown as CampaignStore;
  const openNote = vi.fn();
  const onClosed = vi.fn();
  const before = openedModals.length;
  openCoinEntry(OBSIDIAN_SHOWING, {} as CoinNotes, store, { path: ONE, line }, openNote, onClosed, STUB_SYNTAX);
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
  let given: CoinEntryChoices | null = null;
  if (canDelete) given = entry;
  const onClosed = vi.fn();
  const shown = new CoinDialog(OBSIDIAN_TELLING, "Session 1", vi.fn(async () => true), given, null, onClosed);
  const modal = new ModalFrame({} as App, shown);
  modal.open();
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  return { modal, shown, button, entry, onClosed };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("deleting a ledger entry", () => {
  it("deletes only on a second press, then closes", async () => {
    const { shown, button, entry, onClosed } = openDialog(true);
    button("Delete entry")!.click();
    expect(entry.delete).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith("deleted");
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
    const { shown, button, entry, onClosed } = openDialog(true, async () => {
      throw new Error("the disk is full");
    });
    const deleting = button("Delete entry")!;
    deleting.click();
    deleting.click();
    await shown.settled();
    expect(Notice.shown).toEqual(["Couldn't change the entry: the disk is full"]);
    deleting.click();
    expect(entry.delete).toHaveBeenCalledOnce();
    deleting.click();
    expect(entry.delete).toHaveBeenCalledTimes(2);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("closes unchanged when the delete wrote nothing", async () => {
    const { shown, button, entry, onClosed } = openDialog(true, async () => false);
    button("Delete entry")!.click();
    button("Press again to delete")!.click();
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith("unchanged");
    expect(entry.delete).toHaveBeenCalledOnce();
  });

  it("closes Add coin, which has nothing to delete", () => {
    const { button, onClosed } = openDialog(false);
    expect(button("Delete entry")).toBeUndefined();
    button("Cancel")!.click();
    expect(onClosed).toHaveBeenCalledWith("unchanged");
  });
});

function openHeldEntry() {
  const held: ((wrote: boolean) => void)[] = [];
  const hold = () =>
    new Promise<boolean>((resolve) => {
      held.push(resolve);
    });
  const save = vi.fn(hold);
  const entry = { draft: { direction: "in" as const, amount: "2 gp", what: "tip" }, cannotSave: null, delete: vi.fn(hold) };
  const onClosed = vi.fn();
  const shown = new CoinDialog(OBSIDIAN_TELLING, "Session 1", save, entry, null, onClosed);
  const modal = new ModalFrame({} as App, shown);
  modal.open();
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  const finishFirst = (wrote: boolean) => {
    const resolve = held[0];
    if (resolve === undefined) throw new Error("Nothing is held yet.");
    resolve(wrote);
  };
  return { modal, shown, button, save, entry, onClosed, finishFirst };
}

describe("a ledger entry asked to save and delete at once", () => {
  it("closes as written when Delete is pressed while a save runs", async () => {
    const { shown, button, entry, onClosed, finishFirst } = openHeldEntry();
    button("Save").click();
    button("Delete entry").click();
    button("Press again to delete").click();
    finishFirst(true);
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith("written");
    expect(entry.delete).not.toHaveBeenCalled();
  });

  it("closes as deleted when Save is pressed while a delete runs", async () => {
    const { shown, button, save, onClosed, finishFirst } = openHeldEntry();
    button("Delete entry").click();
    button("Press again to delete").click();
    button("Save").click();
    finishFirst(true);
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith("deleted");
    expect(save).not.toHaveBeenCalled();
  });

  it("closes unchanged when a save that wrote nothing ran while Delete was pressed", async () => {
    const { shown, button, entry, onClosed, finishFirst } = openHeldEntry();
    button("Save").click();
    button("Delete entry").click();
    button("Press again to delete").click();
    finishFirst(false);
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith("unchanged");
    expect(entry.delete).not.toHaveBeenCalled();
  });
});

function readsOf(draft: CoinDraft): string {
  const reading = readCoinDraft(draft);
  if ("error" in reading) throw new Error(reading.error);
  return reading.reads;
}

class CoinAt {
  readonly save = vi.fn(async (_line: CoinLine) => true);
  readonly view = new MountedView();
  readonly shown: CoinDialog;

  constructor(entry: CoinEntryChoices | null) {
    this.shown = new CoinDialog(OBSIDIAN_TELLING, "Session 1", this.save, entry, null, vi.fn());
    this.shown.opened(this.view);
  }

  el<T extends Element>(selector: string): T {
    return this.view.into.querySelector(selector) as T;
  }

  field(label: string): HTMLInputElement {
    return this.el<HTMLInputElement>(`input[aria-label="${label}"]`);
  }

  typed(label: string, value: string): void {
    const input = this.field(label);
    input.value = value;
    input.dispatchEvent(new (input.ownerDocument.defaultView!).Event("input"));
  }

  chooseDirection(value: string): void {
    const select = this.el<HTMLSelectElement>("select");
    select.value = value;
    select.dispatchEvent(new (select.ownerDocument.defaultView!).Event("change"));
  }

  reading(): { text: string | null; isError: boolean } {
    const reading = this.el<HTMLElement>(".dd-reading");
    return { text: reading.textContent, isError: reading.classList.contains("dd-error") };
  }

  pressSave(): void {
    Array.from(this.view.into.querySelectorAll("button")).find((button) => button.textContent === "Save")!.click();
  }
}

describe("the coin dialog's reading", () => {
  it("starts in the money direction, and reads nothing while no amount is typed", () => {
    const coin = new CoinAt(null);
    expect(coin.view.focused()).toBe(coin.el("select"));
    expect(coin.reading()).toEqual({ text: "", isError: false });
    expect(coin.el(".dd-reading").getAttribute("aria-live")).toBe("polite");
  });

  it("reads the line back as it is typed, and again when the direction changes", () => {
    const coin = new CoinAt(null);
    coin.typed("Amount", "5 gp");
    coin.typed("What for", "found");
    expect(coin.reading()).toEqual({ text: readsOf({ direction: "in", amount: "5 gp", what: "found" }), isError: false });
    coin.chooseDirection("out");
    expect(coin.reading().text).toBe(readsOf({ direction: "out", amount: "5 gp", what: "found" }));
  });

  it("marks a reading that can't be saved, and clears the mark once it can", () => {
    const coin = new CoinAt(null);
    coin.typed("Amount", "five");
    expect(coin.reading().isError).toBe(true);
    coin.typed("Amount", "5 gp");
    expect(coin.reading().isError).toBe(false);
  });

  it("saves nothing for an amount it can't read, and puts the cursor back in the amount", () => {
    const coin = new CoinAt(null);
    coin.typed("Amount", "five");
    coin.field("What for").focus();
    coin.pressSave();
    expect(coin.save).not.toHaveBeenCalled();
    expect(coin.view.focused()).toBe(coin.field("Amount"));
  });

  it("saves the line in the direction chosen", async () => {
    const coin = new CoinAt(null);
    coin.chooseDirection("out");
    coin.typed("Amount", "2 gp");
    coin.typed("What for", "rope");
    coin.pressSave();
    await coin.shown.settled();
    expect(coin.save.mock.calls[0]![0]).toEqual(readCoinDraft({ direction: "out", amount: "2 gp", what: "rope" }));
  });

  it("says in its reading why an entry it can't show can't be saved", () => {
    const coin = new CoinAt({ draft: { direction: "in", amount: "2 gp", what: "tip" }, cannotSave: "Change it in its note.", delete: vi.fn() });
    expect(coin.reading()).toEqual({ text: "Change it in its note.", isError: true });
  });
});
