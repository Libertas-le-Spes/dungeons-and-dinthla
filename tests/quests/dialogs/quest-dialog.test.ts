import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { PartlyWritten } from "../../../src/campaign/writing/note-editor";
import { QuestDialog } from "../../../src/quests/dialogs/quest-dialog";
import type { QuestEdit } from "../../../src/quests/writing/quest-plan";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";
import { ModalFrame } from "../../../src/obsidian/views/frames/modal-frame";
import { CONFIRM_MS } from "../../../src/views/dialogs/second-press";
import { Notice } from "../../stubs/obsidian";
import { MountedView } from "../../host/showing/mounted-view";

function dialog(deleteNote: () => Promise<boolean> = async () => true) {
  const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "! Find the caravan" }]).quests;
  const choices = { save: vi.fn(async () => true), delete: vi.fn(deleteNote) };
  const onClosed = vi.fn();
  const places = { givenIn: "Session 1", finishedIn: "Session 1", writesTo: "Session 1" };
  const shown = new QuestDialog(OBSIDIAN_TELLING, record!, places, false, choices, onClosed);
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

describe("QuestDialog", () => {
  it("deletes only on a second press, then closes", async () => {
    const { modal, shown, button, choices, onClosed } = openDialog();
    button("Delete quest")!.click();
    expect(choices.delete).not.toHaveBeenCalled();
    button("Press again to delete")!.click();
    await shown.settled();
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
    const { modal, shown, button, choices, onClosed } = openDialog(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const deleting = button("Delete quest")!;
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
    const deleting = button("Delete quest")!;
    deleting.click();
    deleting.click();
    await shown.settled();
    expect(Notice.shown).toEqual(["Couldn't change the quest: the disk is full"]);
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

class QuestAt {
  readonly choices = { save: vi.fn(async (_edit: QuestEdit) => true), delete: vi.fn(async () => true) };
  readonly shown: QuestDialog;
  readonly modal: ModalFrame;

  constructor(text: string, canCollectReward: boolean) {
    const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text }]).quests;
    const places = { givenIn: "Session 1", finishedIn: "Session 3", writesTo: "Session 4" };
    this.shown = new QuestDialog(OBSIDIAN_TELLING, record!, places, canCollectReward, this.choices, vi.fn());
    this.modal = new ModalFrame({} as App, this.shown);
    this.modal.contentEl.ownerDocument.body.append(this.modal.contentEl);
    this.modal.open();
  }

  el<T extends Element>(selector: string): T {
    return this.modal.contentEl.querySelector(selector) as T;
  }

  texts(selector: string): string[] {
    const texts: string[] = [];
    for (const el of this.modal.contentEl.querySelectorAll(selector)) texts.push(String(el.textContent));
    return texts;
  }

  rewardRow(): HTMLElement {
    return this.el<HTMLElement>(".checkbox-container").closest(".setting-item") as HTMLElement;
  }

  choose(status: string): void {
    const select = this.el<HTMLSelectElement>("select");
    select.value = status;
    select.dispatchEvent(new (select.ownerDocument.defaultView!).Event("change"));
  }

  async save(): Promise<void> {
    Array.from(this.modal.contentEl.querySelectorAll("button")).find((button) => button.textContent === "Save")!.click();
    await this.shown.settled();
  }
}

describe("QuestDialog's fields", () => {
  it("shows the quest, who gave it, its reward and where it was given, and starts on its status", () => {
    const quest = new QuestAt("! Find the caravan, from: [[Lady Vess]], reward: 200 gp", false);
    expect(quest.texts("p")).toEqual(["Find the caravan", "From [[Lady Vess]] · Reward 200 gp", "Given in Session 1", "New lines go into Session 4."]);
    expect(quest.el<HTMLSelectElement>("select").value).toBe("active");
    expect(quest.texts("option")).toEqual(["Active", "Completed", "Abandoned"]);
    expect(quest.el("select").ownerDocument.activeElement).toBe(quest.el("select"));
  });

  it("says where a changed outcome goes for a finished quest, and starts on its outcome", () => {
    const quest = new QuestAt("! Find the caravan\n!= Find the caravan: found it", false);
    expect(quest.el<HTMLSelectElement>("select").value).toBe("completed");
    expect(quest.el<HTMLTextAreaElement>("textarea").value).toBe("found it");
    expect(quest.el(".dd-where").textContent).toBe("New lines go into Session 4; a changed outcome, with its reward and follow-up, goes into Session 3.");
  });

  it("empties what happened when the quest is set back to active", async () => {
    const quest = new QuestAt("! Find the caravan\n!= Find the caravan: found it", false);
    quest.choose("active");
    expect(quest.el<HTMLTextAreaElement>("textarea").value).toBe("");
    await quest.save();
    expect(quest.choices.save.mock.calls[0]![0]).toMatchObject({ status: "active", happened: "" });
  });

  it("offers no reward switch when there is no reward to collect", () => {
    expect(new QuestAt("! Find the caravan", false).el(".checkbox-container")).toBeNull();
  });

  it("shows the reward switch, on, only while the quest is set to completed, and saves what it is set to", async () => {
    const quest = new QuestAt("! Find the caravan, reward: 200 gp", true);
    expect(quest.rewardRow().querySelector(".setting-item-name")!.textContent).toBe("Reward collected: add 200 gp to the party funds");
    expect(quest.rewardRow().style.display).toBe("none");
    quest.choose("completed");
    expect(quest.rewardRow().style.display).toBe("");
    expect(quest.el(".checkbox-container").classList.contains("is-enabled")).toBe(true);
    quest.el<HTMLElement>(".checkbox-container").click();
    quest.choose("failed");
    expect(quest.rewardRow().style.display).toBe("none");
    quest.choose("completed");
    await quest.save();
    expect(quest.choices.save.mock.calls[0]![0]).toMatchObject({ status: "completed", collectReward: false });
  });

  it("puts the cursor in the status when it opens, whatever the frame focuses", () => {
    const [record] = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "! Find the caravan" }]).quests;
    const shown = new QuestDialog(OBSIDIAN_TELLING, record!, { givenIn: "Session 1", finishedIn: "Session 1", writesTo: "Session 1" }, false, { save: vi.fn(), delete: vi.fn() }, vi.fn());
    const view = new MountedView();
    shown.opened(view);
    expect(view.focused()).toBe(view.into.querySelector("select"));
  });

  it("ignores a status it doesn't know", () => {
    const quest = new QuestAt("! Find the caravan\n!= Find the caravan: found it", false);
    quest.shown.changed("lost");
    expect(quest.el<HTMLTextAreaElement>("textarea").value).toBe("found it");
  });
});
