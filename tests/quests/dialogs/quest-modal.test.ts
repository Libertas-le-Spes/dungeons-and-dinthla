import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { PartlyWritten } from "../../../src/campaign/writing/note-editor";
import { QuestModal } from "../../../src/quests/dialogs/quest-modal";
import { CONFIRM_MS } from "../../../src/views/dialogs/second-press";
import { Notice } from "../../stubs/obsidian";

function dialog(deleteNote: () => Promise<boolean> = async () => true) {
  const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "! Find the caravan" }]).quests;
  const choices = { save: vi.fn(async () => true), delete: vi.fn(deleteNote) };
  const onClosed = vi.fn();
  const places = { givenIn: "Session 1", finishedIn: "Session 1", writesTo: "Session 1" };
  const modal = new QuestModal({} as App, record!, places, false, choices, onClosed);
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  return { modal, button, choices, onClosed };
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

describe("QuestModal", () => {
  it("deletes only on a second press, then closes", async () => {
    const { modal, button, choices, onClosed } = openDialog();
    button("Delete quest")!.click();
    expect(choices.delete).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await modal.changeSettled();
    expect(onClosed).toHaveBeenCalledWith(true);
    expect(choices.delete).toHaveBeenCalledOnce();
  });

  it("asks again when the second press comes too late", () => {
    vi.useFakeTimers();
    const { button, choices } = openDialog();
    button("Delete quest")!.click();
    vi.advanceTimersByTime(CONFIRM_MS);
    button("Delete quest")!.click();
    expect(choices.delete).not.toHaveBeenCalled();
  });

  it("stops asking to delete once closed", () => {
    vi.useFakeTimers();
    const { button } = openDialog();
    const deleting = button("Delete quest")!;
    deleting.click();
    button("Cancel")!.click();
    expect(deleting.textContent).toBe("Delete quest");
  });

  it("deletes once when pressed twice more during the delete, and stays open until it is done", async () => {
    let finish: (deleted: boolean) => void = () => {};
    const { modal, button, choices, onClosed } = openDialog(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const deleting = button("Delete quest")!;
    deleting.click();
    deleting.click();
    deleting.click();
    deleting.click();
    button("Cancel")!.click();
    expect(onClosed).not.toHaveBeenCalled();
    finish(true);
    await modal.changeSettled();
    expect(onClosed).toHaveBeenCalledWith(true);
    expect(choices.delete).toHaveBeenCalledOnce();
  });

  it("needs two presses again after a failed delete", async () => {
    const { modal, button, choices, onClosed } = openDialog(async () => {
      throw new Error("the disk is full");
    });
    const deleting = button("Delete quest")!;
    deleting.click();
    deleting.click();
    await modal.changeSettled();
    expect(Notice.shown).toEqual(["Couldn't change the quest: the disk is full"]);
    deleting.click();
    expect(choices.delete).toHaveBeenCalledOnce();
    deleting.click();
    expect(choices.delete).toHaveBeenCalledTimes(2);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("says why and closes as changed when only part of a save was written", async () => {
    const { modal, button, choices, onClosed } = openDialog();
    choices.save.mockRejectedValueOnce(new PartlyWritten("Only the answer line was written."));
    button("Save")!.click();
    await modal.changeSettled();
    expect(onClosed).toHaveBeenCalledWith(true);
    expect(Notice.shown).toEqual(["Couldn't change the quest: Only the answer line was written."]);
    expect(onClosed).toHaveBeenCalledOnce();
    expect(modal.contentEl.childNodes).toHaveLength(0);
  });

  it("closes safely when it never finished opening", () => {
    const { modal, onClosed } = dialog();
    modal.close();
    expect(onClosed).toHaveBeenCalledWith(false);
  });
});
