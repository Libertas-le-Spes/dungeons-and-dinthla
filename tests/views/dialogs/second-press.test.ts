import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ButtonComponent as ObsidianButton } from "obsidian";
import { CONFIRM_MS, deleteOnSecondPress, PRESS_AGAIN, SecondPress } from "../../../src/views/dialogs/second-press";
import { ButtonComponent } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";

function pressed() {
  const shown: boolean[] = [];
  const confirmed = vi.fn();
  const press = new SecondPress((armed) => shown.push(armed), confirmed);
  return { press, shown, confirmed };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SecondPress", () => {
  it("only asks on the first press", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    expect(confirmed).not.toHaveBeenCalled();
    expect(shown).toEqual([true]);
  });

  it("goes ahead on a second press", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    press.press();
    expect(confirmed).toHaveBeenCalledOnce();
    expect(shown).toEqual([true, false]);
  });

  it("asks again when the second press comes too late", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    vi.advanceTimersByTime(CONFIRM_MS);
    press.press();
    expect(confirmed).not.toHaveBeenCalled();
    expect(shown).toEqual([true, false, true]);
  });

  it("changes nothing when stopped before a press", () => {
    const { press, shown } = pressed();
    press.stop();
    expect(shown).toEqual([]);
  });

  it("stops asking when stopped", () => {
    const { press, shown, confirmed } = pressed();
    press.press();
    press.stop();
    press.press();
    expect(confirmed).not.toHaveBeenCalled();
    expect(shown).toEqual([true, false, true]);
  });
});

describe("deleteOnSecondPress", () => {
  function deleteButton() {
    const confirmed = vi.fn();
    const button = new ButtonComponent(obsidianDocument().createElement("div"));
    const secondPress = deleteOnSecondPress(button as unknown as ObsidianButton, "Delete thing", confirmed);
    return { element: button.buttonEl, secondPress, confirmed };
  }

  it("shows the label as a warning delete button", () => {
    const { element } = deleteButton();
    expect(element.textContent).toBe("Delete thing");
    expect(element.classList.contains("mod-warning")).toBe(true);
    expect(element.classList.contains("dd-delete")).toBe(true);
  });

  it("asks on the first press and deletes on the second, showing the label again", () => {
    const { element, confirmed } = deleteButton();
    element.click();
    expect(element.textContent).toBe(PRESS_AGAIN);
    expect(confirmed).not.toHaveBeenCalled();
    element.click();
    expect(confirmed).toHaveBeenCalledOnce();
    expect(element.textContent).toBe("Delete thing");
  });

  it("gives back the second press it uses, so it can be stopped", () => {
    const { element, secondPress } = deleteButton();
    element.click();
    secondPress.stop();
    expect(element.textContent).toBe("Delete thing");
  });
});
