import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { QuestionModal } from "../../src/questions/question-modal";
import { CONFIRM_MS } from "../../src/views/second-press";

function openDialog() {
  const [question] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "? Who sent the letter" }]).questions;
  const choices = { save: vi.fn(async () => true), reopen: vi.fn(async () => true), delete: vi.fn(async () => true) };
  const onClosed = vi.fn();
  const places = { askedIn: "Session 1", answeredIn: "Session 1", writesTo: "Session 1" };
  const modal = new QuestionModal({} as App, question!, places, choices, onClosed);
  modal.open();
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  return { button, choices, onClosed };
}

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
});
