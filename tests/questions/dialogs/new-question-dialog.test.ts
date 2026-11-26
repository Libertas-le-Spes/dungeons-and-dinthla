import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { NewQuestionDialog } from "../../../src/questions/dialogs/new-question-dialog";
import type { NewQuestion } from "../../../src/questions/writing/new-question";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";
import { ModalFrame } from "../../../src/obsidian/views/frames/modal-frame";
import { Notice } from "../../stubs/obsidian";

function opened(add: (entry: NewQuestion) => Promise<boolean>) {
  const onClosed = vi.fn();
  const added = vi.fn(add);
  const shown = new NewQuestionDialog(OBSIDIAN_TELLING, "Session 2", added, onClosed);
  const modal = new ModalFrame({} as App, shown);
  modal.contentEl.ownerDocument.body.append(modal.contentEl);
  modal.open();
  const button = (text: string) => Array.from(modal.contentEl.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  const question = modal.contentEl.querySelector("input")!;
  const answer = modal.contentEl.querySelector("textarea")!;
  return { modal, shown, added, onClosed, button, question, answer };
}

function typed(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new (el.ownerDocument.defaultView!).Event("input"));
}

beforeEach(() => {
  Notice.shown = [];
});

describe("NewQuestionDialog", () => {
  it("says where the lines go, starts in the question, and adds what was typed on Save, then closes", async () => {
    const { modal, shown, added, onClosed, button, question, answer } = opened(async () => true);
    expect(modal.contentEl.querySelector(".dd-where")!.textContent).toBe("New lines go into Session 2.");
    expect(question.ownerDocument.activeElement).toBe(question);
    typed(question, "Who rang");
    typed(answer, "Mira");
    button("Save").click();
    await shown.settled();
    expect(added.mock.calls).toEqual([[{ question: "Who rang", answer: "Mira" }]]);
    expect(onClosed).toHaveBeenCalledOnce();
  });

  it("stays open with the question focused again when nothing was added", async () => {
    const { shown, onClosed, button, question, answer } = opened(async () => false);
    answer.focus();
    button("Save").click();
    await shown.settled();
    expect(onClosed).not.toHaveBeenCalled();
    expect(question.ownerDocument.activeElement).toBe(question);
  });

  it("says why it couldn't add, and stays open", async () => {
    const { shown, onClosed, button } = opened(async () => Promise.reject(new Error("the disk is full")));
    button("Save").click();
    await shown.settled();
    expect(Notice.shown).toEqual(["Couldn't add the question: the disk is full"]);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("stays open on Cancel while it is still adding, then closes once added", async () => {
    let finish: (added: boolean) => void = () => undefined;
    const { shown, onClosed, button } = opened(() => new Promise<boolean>((resolve) => (finish = resolve)));
    button("Save").click();
    button("Cancel").click();
    expect(onClosed).not.toHaveBeenCalled();
    finish(true);
    await shown.settled();
    expect(onClosed).toHaveBeenCalledOnce();
  });

  it("closes without adding on Cancel", () => {
    const { added, onClosed, button } = opened(async () => true);
    button("Cancel").click();
    expect(added).not.toHaveBeenCalled();
    expect(onClosed).toHaveBeenCalledOnce();
  });
});
