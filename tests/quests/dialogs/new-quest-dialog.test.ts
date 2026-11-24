import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { NewQuestDialog } from "../../../src/quests/dialogs/new-quest-dialog";
import type { NewQuest } from "../../../src/quests/writing/new-quest";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";
import { ModalFrame } from "../../../src/obsidian/views/frames/modal-frame";
import { NameSuggest } from "../../../src/obsidian/views/mount/name-suggest";
import { Notice, openedInputSuggests } from "../../stubs/obsidian";

function opened(add: (entry: NewQuest) => Promise<boolean>) {
  const onClosed = vi.fn();
  const added = vi.fn(add);
  const shown = new NewQuestDialog(OBSIDIAN_TELLING, "Session 2", ["Lady Vess", "Mira"], added, onClosed);
  const modal = new ModalFrame({} as App, shown);
  modal.contentEl.ownerDocument.body.append(modal.contentEl);
  modal.open();
  const [title, givenBy, reward] = Array.from(modal.contentEl.querySelectorAll("input"));
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { modal, shown, added, onClosed, title: title!, givenBy: givenBy!, reward: reward!, button };
}

function typed(el: HTMLInputElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new (el.ownerDocument.defaultView!).Event("input"));
}

function enter(el: HTMLInputElement, handledAlready: boolean): void {
  const event = new (el.ownerDocument.defaultView!).KeyboardEvent("keydown", { key: "Enter", cancelable: true });
  if (handledAlready) event.preventDefault();
  el.dispatchEvent(event);
}

beforeEach(() => {
  Notice.shown = [];
  openedInputSuggests.length = 0;
});

describe("NewQuestDialog", () => {
  it("says where the line goes, starts in the title, and adds what was typed on Save, then closes", async () => {
    const { modal, shown, added, onClosed, title, givenBy, reward, button } = opened(async () => true);
    expect(modal.contentEl.querySelector(".dd-where")!.textContent).toBe("Adds a line to Session 2.");
    expect(title.ownerDocument.activeElement).toBe(title);
    typed(title, "Find the caravan");
    typed(givenBy, "Lady Vess");
    typed(reward, "200 gp");
    button("Save").click();
    await shown.settled();
    expect(added.mock.calls).toEqual([[{ title: "Find the caravan", givenBy: "Lady Vess", reward: "200 gp" }]]);
    expect(onClosed).toHaveBeenCalledOnce();
  });

  it("suggests the campaign's characters while typing who gave the quest, and only there", () => {
    const { givenBy } = opened(async () => true);
    expect(openedInputSuggests).toHaveLength(1);
    expect(openedInputSuggests[0]).toBeInstanceOf(NameSuggest);
    expect(openedInputSuggests[0]!.textInputEl).toBe(givenBy);
  });

  it.each([
    ["the title", "title", 1],
    ["the reward", "reward", 1],
    ["who gave it, where Enter picks a suggestion", "givenBy", 0],
  ] as const)("saves on Enter in %s", async (_field, field, saves) => {
    const fields = opened(async () => true);
    enter(fields[field], false);
    await fields.shown.settled();
    expect(fields.added).toHaveBeenCalledTimes(saves);
  });

  it("doesn't save on an Enter something else already took", async () => {
    const { shown, added, title } = opened(async () => true);
    enter(title, true);
    await shown.settled();
    expect(added).not.toHaveBeenCalled();
  });

  it("stays open with the title focused again when nothing was added", async () => {
    const { shown, onClosed, button, title, reward } = opened(async () => false);
    reward.focus();
    button("Save").click();
    await shown.settled();
    expect(onClosed).not.toHaveBeenCalled();
    expect(title.ownerDocument.activeElement).toBe(title);
  });

  it("stays open on Cancel while it is still adding", () => {
    const { onClosed, button } = opened(() => new Promise<boolean>(() => undefined));
    button("Save").click();
    button("Cancel").click();
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("says why it couldn't add, and stays open", async () => {
    const { shown, onClosed, button } = opened(async () => Promise.reject(new Error("the disk is full")));
    button("Save").click();
    await shown.settled();
    expect(Notice.shown).toEqual(["Couldn't add the quest: the disk is full"]);
    expect(onClosed).not.toHaveBeenCalled();
  });
});
