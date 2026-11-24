import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonRow } from "../../../src/views/components/dialogs/button-row";
import { DeleteButton } from "../../../src/views/components/dialogs/delete-button";
import { MainButton, PlainButton } from "../../../src/views/components/dialogs/dialog-buttons";
import { TextAreaField } from "../../../src/views/components/dialogs/text-area-field";
import { TextField } from "../../../src/views/components/dialogs/text-field";
import { KeptHandle } from "../../../src/views/elements/bindings/kept-handle";
import { HERE } from "../../../src/views/elements/bindings/open-place";
import type { ViewElement } from "../../../src/views/elements/view-element";
import { CONFIRM_MS, PRESS_AGAIN } from "../../../src/views/dialogs/second-press";
import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import { obsidianDocument } from "../../stubs/obsidian-dom";

const WORDS = { name: "Answer", label: "Answer given", placeholder: "Lady Vess" };

function mounted(tree: ViewElement): HTMLElement {
  const el = obsidianDocument().createElement("div");
  el.ownerDocument.body.append(el);
  mountTree(tree, el);
  return el;
}

function keyDown(el: HTMLElement, init: KeyboardEventInit): void {
  const view = el.ownerDocument.defaultView!;
  el.dispatchEvent(new view.KeyboardEvent("keydown", { cancelable: true, ...init }));
}

function typed(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new (el.ownerDocument.defaultView!).Event("input"));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("a text field", () => {
  it("draws a settings row holding a named, labelled input with its value and placeholder", () => {
    const built = mounted(new TextField(WORDS, { changed: vi.fn() }, { run: vi.fn() }).build("Mira", null));
    expect(built.querySelector(".setting-item-name")!.textContent).toBe("Answer");
    const input = built.querySelector(".setting-item-control input") as HTMLInputElement;
    expect(input.getAttribute("aria-label")).toBe("Answer given");
    expect(input.placeholder).toBe("Lady Vess");
    expect(input.value).toBe("Mira");
  });

  it("hands on what is typed, saves on Enter, and gives its handle to focus it", () => {
    const field = { changed: vi.fn() };
    const submit = { run: vi.fn() };
    const handle = new KeptHandle();
    const built = mounted(new TextField(WORDS, field, submit).build("", handle));
    const input = built.querySelector("input")!;
    typed(input, "Rope");
    keyDown(input, { key: "Enter" });
    handle.focus();
    expect(field.changed).toHaveBeenCalledWith("Rope");
    expect(submit.run.mock.calls).toEqual([[HERE]]);
    expect(input.ownerDocument.activeElement).toBe(input);
  });
});

describe("a text area field", () => {
  it("draws a settings row holding a named, labelled text area with its value", () => {
    const built = mounted(new TextAreaField(WORDS, { changed: vi.fn() }, { run: vi.fn() }).build("Lines", null));
    const area = built.querySelector(".setting-item-control textarea") as HTMLTextAreaElement;
    expect(built.querySelector(".setting-item-name")!.textContent).toBe("Answer");
    expect(area.getAttribute("aria-label")).toBe("Answer given");
    expect(area.value).toBe("Lines");
    expect(area.hasAttribute("rows")).toBe(false);
  });

  it.each([
    ["Enter alone, which starts a new line", {}, 0],
    ["Ctrl+Enter", { ctrlKey: true }, 1],
    ["Cmd+Enter", { metaKey: true }, 1],
  ])("saves only with a modifier: %s", (_keys, held, saves) => {
    const submit = { run: vi.fn() };
    const built = mounted(new TextAreaField(WORDS, { changed: vi.fn() }, submit).build("", null));
    keyDown(built.querySelector("textarea")!, { key: "Enter", ...held });
    expect(submit.run).toHaveBeenCalledTimes(saves);
  });
});

describe("dialog buttons", () => {
  it("draws a row of buttons as a settings row with no name, the main one marked", () => {
    const row = new ButtonRow().build([new MainButton("Save", { run: vi.fn() }).build(), new PlainButton("Cancel", { run: vi.fn() }).build()]);
    expect(mounted(row).innerHTML).toBe(
      '<div class="setting-item"><div class="setting-item-info"><div class="setting-item-name"></div><div class="setting-item-description"></div></div><div class="setting-item-control"><button class="mod-cta">Save</button><button>Cancel</button></div></div>',
    );
  });

  it.each([
    ["main", (run: { run: () => void }) => new MainButton("Save", run).build()],
    ["plain", (run: { run: () => void }) => new PlainButton("Cancel", run).build()],
  ])("runs a %s button's action when pressed", (_kind, build) => {
    const action = { run: vi.fn() };
    mounted(build(action)).querySelector("button")!.click();
    expect(action.run.mock.calls).toEqual([[HERE]]);
  });
});

describe("a delete button", () => {
  function deleting() {
    const confirmed = { run: vi.fn() };
    const deleteButton = new DeleteButton("Delete question", confirmed);
    const button = mounted(deleteButton.build()).querySelector("button")!;
    return { confirmed, deleteButton, button };
  }

  it("draws a warning button with the plugin's delete class", () => {
    expect(deleting().button.outerHTML).toBe('<button class="mod-warning dd-delete">Delete question</button>');
  });

  it("asks on the first press and deletes on the second", () => {
    const { confirmed, button } = deleting();
    button.click();
    expect(button.textContent).toBe(PRESS_AGAIN);
    expect(confirmed.run).not.toHaveBeenCalled();
    button.click();
    expect(confirmed.run.mock.calls).toEqual([[HERE]]);
    expect(button.textContent).toBe("Delete question");
  });

  it("asks again when the second press comes too late", () => {
    vi.useFakeTimers();
    const { confirmed, button } = deleting();
    button.click();
    vi.advanceTimersByTime(CONFIRM_MS);
    expect(button.textContent).toBe("Delete question");
    button.click();
    expect(confirmed.run).not.toHaveBeenCalled();
  });

  it("stops asking when stopped", () => {
    const { confirmed, deleteButton, button } = deleting();
    button.click();
    deleteButton.stop();
    expect(button.textContent).toBe("Delete question");
    button.click();
    expect(confirmed.run).not.toHaveBeenCalled();
  });
});
