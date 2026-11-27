import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { CARRYING_CLOSING, CARRYING_PARAGRAPHS, CARRYING_PROPERTIES, CARRYING_TITLE, CarryingNoticeDialog } from "../../../src/characters/carrying/carrying-notice-dialog";
import { ModalFrame } from "../../../src/obsidian/views/frames/modal-frame";
import type { Modal as StubModal } from "../../stubs/obsidian";

function opened() {
  const modal = new ModalFrame({} as App, new CarryingNoticeDialog());
  modal.contentEl.ownerDocument.body.append(modal.contentEl);
  const close = vi.spyOn(modal, "close");
  modal.open();
  const buttons = Array.from(modal.contentEl.querySelectorAll("button"));
  return { modal, close, buttons };
}

describe("CarryingNoticeDialog", () => {
  it("tells how to carry a character over, with the two properties to add, and focuses its one button", () => {
    const { modal, buttons } = opened();
    expect((modal as unknown as StubModal).title).toBe(CARRYING_TITLE);
    expect(Array.from(modal.contentEl.querySelectorAll("p")).map((paragraph) => paragraph.textContent)).toEqual([...CARRYING_PARAGRAPHS, CARRYING_CLOSING]);
    expect(modal.contentEl.querySelector("pre")!.textContent).toBe(CARRYING_PROPERTIES);
    expect(buttons.map((button) => button.textContent)).toEqual(["Got it"]);
    expect(modal.contentEl.ownerDocument.activeElement).toBe(buttons[0]);
  });

  it("closes when Got it is pressed", () => {
    const { close, buttons } = opened();
    buttons[0]!.click();
    expect(close).toHaveBeenCalledOnce();
  });
});
