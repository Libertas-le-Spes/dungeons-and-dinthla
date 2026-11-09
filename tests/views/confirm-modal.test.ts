import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { ConfirmModal } from "../../src/views/confirm-modal";
import type { Modal as StubModal } from "../stubs/obsidian";

const TEXT = { title: "Delete Session 12 · The Old Mill?", body: "Its 2 notes go with it.", confirm: "Delete session", keep: "Keep session" };

function opened() {
  const confirmed = vi.fn();
  const modal = new ConfirmModal({} as App, TEXT, confirmed);
  modal.contentEl.ownerDocument.body.append(modal.contentEl);
  const close = vi.spyOn(modal, "close");
  modal.open();
  const buttons = Array.from(modal.contentEl.querySelectorAll("button"));
  return { modal, confirmed, close, buttons };
}

describe("ConfirmModal", () => {
  it("asks with its title and words, the danger button first and the keep button focused", () => {
    const { modal, buttons } = opened();
    expect((modal as unknown as StubModal).title).toBe(TEXT.title);
    expect(modal.contentEl.querySelector("p")!.textContent).toBe(TEXT.body);
    expect(buttons.map((button) => [button.textContent, button.classList.contains("mod-warning")])).toEqual([
      ["Delete session", true],
      ["Keep session", false],
    ]);
    expect(modal.contentEl.ownerDocument.activeElement).toBe(buttons[1]);
  });

  it("closes without confirming when kept", () => {
    const { confirmed, close, buttons } = opened();
    buttons[1]!.click();
    expect(close).toHaveBeenCalledOnce();
    expect(confirmed).not.toHaveBeenCalled();
  });

  it("closes, then confirms once, when the danger button is pressed", () => {
    const { confirmed, close, buttons } = opened();
    buttons[0]!.click();
    expect(close).toHaveBeenCalledOnce();
    expect(confirmed).toHaveBeenCalledOnce();
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(confirmed.mock.invocationCallOrder[0]!);
  });
});
