import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SecondPress } from "../../src/views/second-press";
import { Notice } from "../stubs/obsidian";
import { FAILURE, SampleDialog } from "./sample-dialog";

const BROKEN = new Error("The note is gone.");

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function openDialog(): SampleDialog {
  const dialog = new SampleDialog(false);
  dialog.open();
  return dialog;
}

function openClosingDialog(): SampleDialog {
  const dialog = new SampleDialog(true);
  dialog.open();
  return dialog;
}

function heldPress(): SecondPress {
  return { stop: vi.fn() } as unknown as SecondPress;
}

beforeEach(() => {
  Notice.shown = [];
});

describe("a change dialog's change", () => {
  it("starts once when saved twice while the first save runs", () => {
    const dialog = openDialog();
    dialog.save();
    dialog.save();
    expect(dialog.changes).toHaveLength(1);
  });

  it("can start again once a change has finished", async () => {
    const dialog = openDialog();
    dialog.save();
    dialog.changeAt(0).finish(false);
    await settled();
    dialog.save();
    expect(dialog.changes).toHaveLength(2);
  });

  it("can start again once a change has failed", async () => {
    const dialog = openDialog();
    dialog.save();
    dialog.changeAt(0).fail(BROKEN);
    await settled();
    dialog.save();
    expect(dialog.changes).toHaveLength(2);
  });

  it("hands the dialog whether a finished change wrote", async () => {
    const dialog = openDialog();
    dialog.save();
    dialog.changeAt(0).finish(false);
    await settled();
    dialog.save();
    dialog.changeAt(1).finish(true);
    await settled();
    expect(dialog.finishedWith).toEqual([false, true]);
    expect(dialog.failedWith).toEqual([]);
  });

  it("says why a change failed in the dialog's words, then hands the dialog the error", async () => {
    const dialog = openDialog();
    dialog.save();
    dialog.changeAt(0).fail(BROKEN);
    await settled();
    expect(Notice.shown).toEqual([`${FAILURE}: The note is gone.`]);
    expect(dialog.noticesWhenFailed).toEqual([1]);
    expect(dialog.failedWith).toEqual([BROKEN]);
    expect(dialog.finishedWith).toEqual([]);
  });

  it("says nothing when a change finishes", async () => {
    const dialog = openDialog();
    dialog.save();
    dialog.changeAt(0).finish(true);
    await settled();
    expect(Notice.shown).toEqual([]);
  });
});

describe("closing a change dialog", () => {
  it("stays open when closed while a change runs", () => {
    const dialog = openDialog();
    dialog.save();
    dialog.close();
    expect(dialog.closedTimes).toBe(0);
    expect(dialog.contentEl.textContent).toBe("Sample");
  });

  it("closes once the change it was running has finished", async () => {
    const dialog = openDialog();
    dialog.save();
    dialog.changeAt(0).finish(false);
    await settled();
    dialog.close();
    expect(dialog.closedTimes).toBe(1);
  });

  it("closes once the change it was running has failed", async () => {
    const dialog = openDialog();
    dialog.save();
    dialog.changeAt(0).fail(BROKEN);
    await settled();
    dialog.close();
    expect(dialog.closedTimes).toBe(1);
  });

  it("closes once when the dialog closes as soon as its change finishes", async () => {
    const dialog = openClosingDialog();
    dialog.save();
    dialog.changeAt(0).finish(true);
    await settled();
    expect(dialog.closedTimes).toBe(1);
  });

  it("closes once when the dialog closes as soon as its change fails", async () => {
    const dialog = openClosingDialog();
    dialog.save();
    dialog.changeAt(0).fail(BROKEN);
    await settled();
    expect(dialog.closedTimes).toBe(1);
  });

  it("stops every second press it keeps, empties itself and tells the dialog", () => {
    const dialog = openDialog();
    const first = heldPress();
    const second = heldPress();
    dialog.keep(first);
    dialog.keep(second);
    dialog.close();
    expect(first.stop).toHaveBeenCalledTimes(1);
    expect(second.stop).toHaveBeenCalledTimes(1);
    expect(dialog.contentEl.childNodes).toHaveLength(0);
    expect(dialog.closedTimes).toBe(1);
  });
});
