import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { QuestModal } from "../../src/quests/quest-modal";
import { CONFIRM_MS } from "../../src/views/second-press";

function openDialog() {
  const [quest] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "! Find the caravan" }]).quests;
  const choices = { save: vi.fn(async () => true), delete: vi.fn(async () => true) };
  const onClosed = vi.fn();
  const places = { givenIn: "Session 1", finishedIn: "Session 1", writesTo: "Session 1" };
  const modal = new QuestModal({} as App, quest!, places, false, choices, onClosed);
  modal.open();
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  return { button, choices, onClosed };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("QuestModal", () => {
  it("deletes only on a second press, then closes", async () => {
    const { button, choices, onClosed } = openDialog();
    button("Delete quest")!.click();
    expect(choices.delete).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledWith(true));
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
});
