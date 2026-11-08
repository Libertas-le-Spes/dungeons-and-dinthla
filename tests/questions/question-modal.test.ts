import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { QuestionModal } from "../../src/questions/question-modal";
import { CONFIRM_MS } from "../../src/views/second-press";
import { Notice } from "../stubs/obsidian";

function dialog(deleteNote: () => Promise<boolean> = async () => true) {
  const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "? Who sent the letter" }]).questions;
  const choices = { save: vi.fn(async () => true), reopen: vi.fn(async () => true), delete: vi.fn(deleteNote) };
  const onClosed = vi.fn();
  const places = { askedIn: "Session 1", answeredIn: "Session 1", writesTo: "Session 1" };
  const modal = new QuestionModal({} as App, record!, places, choices, onClosed);
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

describe("QuestionModal", () => {
  it("deletes only on a second press, then closes", async () => {
    const { button, choices, onClosed } = openDialog();
    button("Delete question")!.click();
    expect(choices.delete).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledWith(true));
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
    const { button, choices, onClosed } = openDialog(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const deleting = button("Delete question")!;
    deleting.click();
    deleting.click();
    deleting.click();
    deleting.click();
    button("Cancel")!.click();
    expect(onClosed).not.toHaveBeenCalled();
    finish(true);
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledWith(true));
    expect(choices.delete).toHaveBeenCalledOnce();
  });

  it("needs two presses again after a failed delete", async () => {
    const { button, choices, onClosed } = openDialog(async () => {
      throw new Error("the disk is full");
    });
    const deleting = button("Delete question")!;
    deleting.click();
    deleting.click();
    await vi.waitFor(() => expect(Notice.shown).toEqual(["Couldn't change the question: the disk is full"]));
    deleting.click();
    expect(choices.delete).toHaveBeenCalledOnce();
    deleting.click();
    expect(choices.delete).toHaveBeenCalledTimes(2);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("closes safely when it never finished opening", () => {
    const { modal, onClosed } = dialog();
    modal.close();
    expect(onClosed).toHaveBeenCalledWith(false);
  });
});
