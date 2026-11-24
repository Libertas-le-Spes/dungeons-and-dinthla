import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { ModalFrame, ObsidianDialogs } from "../../../../src/obsidian/views/frames/modal-frame";
import type { DialogView, ShownDialog } from "../../../../src/views/dialogs/dialog-view";
import { Paragraph } from "../../../../src/views/elements/kinds/containers";
import { openedModals, type Modal as StubModal } from "../../../stubs/obsidian";

class SampleDialog implements ShownDialog {
  readonly title = "Sample";
  readonly cls = ["dd-dialog"];
  view: DialogView | null = null;
  closing = true;
  closedTimes = 0;

  opened(view: DialogView): void {
    this.view = view;
    view.show([new Paragraph({ text: "First" }), new Paragraph({ text: "Second" })]);
  }

  mayClose(): boolean {
    return this.closing;
  }

  closed(): void {
    this.closedTimes += 1;
  }
}

function opened(): { frame: ModalFrame; dialog: SampleDialog } {
  const dialog = new SampleDialog();
  const frame = new ModalFrame({} as App, dialog);
  frame.open();
  return { frame, dialog };
}

describe("the modal frame", () => {
  it("titles itself from the dialog, takes the plugin's tokens and the dialog's classes, and mounts what the dialog shows", () => {
    const { frame } = opened();
    expect((frame as unknown as StubModal).title).toBe("Sample");
    expect(Array.from(frame.contentEl.classList)).toEqual(["dd-tokens", "dd-dialog"]);
    expect(frame.contentEl.innerHTML).toBe("<p>First</p><p>Second</p>");
  });

  it("puts what the dialog shows next in place of what it showed", () => {
    const { frame, dialog } = opened();
    dialog.view!.show([new Paragraph({ text: "Again" })]);
    expect(frame.contentEl.innerHTML).toBe("<p>Again</p>");
  });

  it("stays open while the dialog says it may not close", () => {
    const { frame, dialog } = opened();
    dialog.closing = false;
    dialog.view!.close();
    expect(dialog.closedTimes).toBe(0);
    expect(frame.contentEl.innerHTML).toBe("<p>First</p><p>Second</p>");
  });

  it("empties itself and tells the dialog once when it closes", () => {
    const { frame, dialog } = opened();
    dialog.view!.close();
    expect(frame.contentEl.childNodes).toHaveLength(0);
    expect(dialog.closedTimes).toBe(1);
  });

  it("is what Obsidian's dialogs open for a dialog", () => {
    const dialog = new SampleDialog();
    const open = vi.spyOn(ModalFrame.prototype, "open");
    new ObsidianDialogs({} as App).open(dialog);
    expect(open).toHaveBeenCalledOnce();
    expect((openedModals[openedModals.length - 1] as unknown as ModalFrame).dialog).toBe(dialog);
    open.mockRestore();
  });
});
