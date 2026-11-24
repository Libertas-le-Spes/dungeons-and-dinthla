import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { PartlyWritten } from "../../../src/campaign/writing/note-editor";
import { QuestionDialog } from "../../../src/questions/dialogs/question-dialog";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";
import { ModalFrame } from "../../../src/obsidian/views/frames/modal-frame";
import { CONFIRM_MS } from "../../../src/views/dialogs/second-press";
import { Notice } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import type { ViewElement } from "../../../src/views/elements/view-element";
import type { DialogView } from "../../../src/views/dialogs/dialog-view";

class MountedView implements DialogView {
  constructor(private readonly into: HTMLElement) {}

  show(trees: readonly ViewElement[]): void {
    for (const tree of trees) mountTree(tree, this.into);
  }

  close(): void {}
}

function dialog(deleteNote: () => Promise<boolean> = async () => true) {
  const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "? Who sent the letter" }]).questions;
  const choices = { save: vi.fn(async () => true), reopen: vi.fn(async () => true), delete: vi.fn(deleteNote) };
  const onClosed = vi.fn();
  const places = { askedIn: "Session 1", answeredIn: "Session 1", writesTo: "Session 1" };
  const shown = new QuestionDialog(OBSIDIAN_TELLING, record!, places, choices, onClosed);
  const modal = new ModalFrame({} as App, shown);
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  return { modal, shown, button, choices, onClosed };
}

function openDialog(deleteNote?: () => Promise<boolean>) {
  const opened = dialog(deleteNote);
  opened.modal.open();
  return opened;
}

beforeEach(() => {
  Notice.shown = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("QuestionDialog", () => {
  it("deletes only on a second press, then closes", async () => {
    const { modal, shown, button, choices, onClosed } = openDialog();
    button("Delete question")!.click();
    expect(choices.delete).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith(true);
    expect(choices.delete).toHaveBeenCalledOnce();
  });

  it("asks again when the second press comes too late", () => {
    vi.useFakeTimers();
    const { button, choices } = openDialog();
    button("Delete question")!.click();
    vi.advanceTimersByTime(CONFIRM_MS);
    button("Delete question")!.click();
    expect(choices.delete).not.toHaveBeenCalled();
  });

  it("stops asking to delete once closed", () => {
    vi.useFakeTimers();
    const { button } = openDialog();
    const deleting = button("Delete question")!;
    deleting.click();
    button("Cancel")!.click();
    expect(deleting.textContent).toBe("Delete question");
  });

  it("deletes once when pressed twice more during the delete, and stays open until it is done", async () => {
    let finish: (deleted: boolean) => void = () => {};
    const { modal, shown, button, choices, onClosed } = openDialog(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const deleting = button("Delete question")!;
    deleting.click();
    deleting.click();
    deleting.click();
    deleting.click();
    button("Cancel")!.click();
    expect(onClosed).not.toHaveBeenCalled();
    finish(true);
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith(true);
    expect(choices.delete).toHaveBeenCalledOnce();
  });

  it("needs two presses again after a failed delete", async () => {
    const { modal, shown, button, choices, onClosed } = openDialog(async () => {
      throw new Error("the disk is full");
    });
    const deleting = button("Delete question")!;
    deleting.click();
    deleting.click();
    await shown.settled();
    expect(Notice.shown).toEqual(["Couldn't change the question: the disk is full"]);
    deleting.click();
    expect(choices.delete).toHaveBeenCalledOnce();
    deleting.click();
    expect(choices.delete).toHaveBeenCalledTimes(2);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("says why and closes as changed when only part of a save was written", async () => {
    const { modal, shown, button, choices, onClosed } = openDialog();
    choices.save.mockRejectedValueOnce(new PartlyWritten("Only the answer line was written."));
    button("Save")!.click();
    await shown.settled();
    expect(onClosed).toHaveBeenCalledWith(true);
    expect(Notice.shown).toEqual(["Couldn't change the question: Only the answer line was written."]);
    expect(onClosed).toHaveBeenCalledOnce();
    expect(modal.contentEl.childNodes).toHaveLength(0);
  });

  it.each([
    ["an open question", "? Who sent the letter", ["Save", "Cancel", "Delete question"]],
    ["an answered question", "? Who sent the letter\n?= Who sent the letter: Mira", ["Save", "Reopen question", "Cancel", "Delete question"]],
  ])("offers Reopen only for an answered question: %s", (_kind, text, buttons) => {
    const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text }]).questions;
    const choices = { save: vi.fn(async () => true), reopen: vi.fn(async () => true), delete: vi.fn(async () => true) };
    const places = { askedIn: "Session 1", answeredIn: "Session 1", writesTo: "Session 1" };
    const modal = new ModalFrame({} as App, new QuestionDialog(OBSIDIAN_TELLING, record!, places, choices, vi.fn()));
    modal.open();
    expect(Array.from(modal.contentEl.querySelectorAll("button")).map((button) => button.textContent)).toEqual(buttons);
  });

  it("reopens an answered question on Reopen", async () => {
    const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "? Who\n?= Who: Mira" }]).questions;
    const choices = { save: vi.fn(async () => true), reopen: vi.fn(async () => true), delete: vi.fn(async () => true) };
    const shown = new QuestionDialog(OBSIDIAN_TELLING, record!, { askedIn: "Session 1", answeredIn: "Session 1", writesTo: "Session 1" }, choices, vi.fn());
    const modal = new ModalFrame({} as App, shown);
    modal.open();
    Array.from(modal.contentEl.querySelectorAll("button")).find((button) => button.textContent === "Reopen question")!.click();
    await shown.settled();
    expect(choices.reopen).toHaveBeenCalledOnce();
    expect(choices.save).not.toHaveBeenCalled();
  });

  it("puts the cursor in the answer when it opens, whatever the frame focuses", () => {
    const { shown } = dialog();
    const into = obsidianDocument().createElement("div");
    into.ownerDocument.body.append(into);
    shown.opened(new MountedView(into));
    expect(into.ownerDocument.activeElement).toBe(into.querySelector("textarea"));
  });

  it("closes safely when it never finished opening", () => {
    const { modal, onClosed } = dialog();
    modal.close();
    expect(onClosed).toHaveBeenCalledWith(false);
  });
});
