import { describe, expect, it, vi } from "vitest";
import { ChangeBinding, HandleRequest, KeyBinding, PressBinding } from "../../../../src/views/elements/bindings/bindings";
import { HERE, NEW_TAB } from "../../../../src/views/elements/bindings/open-place";
import type { ElementHandle } from "../../../../src/views/elements/element-handle";
import { Anchor, Button, Details, Div, Heading2, List, ListItem, Paragraph, Section, Select, Span, Summary } from "../../../../src/views/elements/kinds/containers";
import { Option, TextArea, TextInput } from "../../../../src/views/elements/kinds/fields";
import { mountTree } from "../../../../src/obsidian/views/mount/mount-tree";
import { ObsidianMounter } from "../../../../src/obsidian/views/mount/obsidian-mounter";
import { obsidianDocument } from "../../../stubs/obsidian-dom";

function root(): HTMLElement {
  const el = obsidianDocument().createElement("div");
  el.ownerDocument.body.append(el);
  return el;
}

function actionSpy() {
  return { run: vi.fn() };
}

describe("Obsidian's mount step", () => {
  it("puts a tree on the page as the elements it names, with their classes, text and reader words", () => {
    const into = root();
    mountTree(
      new Section({ cls: ["dd-panel", "dd-items-panel"], label: "Items of the party" }, [
        new Heading2({ cls: ["dd-title"], text: "Items" }),
        new List({ cls: ["dd-list"] }, [new ListItem({}, [new Span({ cls: ["dd-text"], text: "Rope" })])]),
        new Paragraph({ cls: ["dd-empty"], text: "Nothing yet.", role: "alert", live: "polite" }),
      ]),
      into,
    );
    expect(into.innerHTML).toBe(
      '<section class="dd-panel dd-items-panel" aria-label="Items of the party"><h2 class="dd-title">Items</h2><ul class="dd-list"><li><span class="dd-text">Rope</span></li></ul><p class="dd-empty" role="alert" aria-live="polite">Nothing yet.</p></section>',
    );
  });

  it("sets every attribute a part names, by its own name", () => {
    const into = root();
    mountTree(new Div({ role: "button", tabIndex: 0, dataPath: "D&D/a.md", dataLine: 3, dataName: "AC", dataItem: "Rope", dataState: "held", id: "dd-1", title: "Rope", current: "page", selected: true, pressed: false, controls: "dd-2", hasPopup: "listbox", labelledBy: "dd-3", hiddenFromReaders: true }), into);
    const div = into.firstElementChild!;
    expect(Object.fromEntries(Array.from(div.attributes).map((attribute) => [attribute.name, attribute.value]))).toEqual({
      role: "button",
      tabindex: "0",
      "data-path": "D&D/a.md",
      "data-line": "3",
      "data-name": "AC",
      "data-item": "Rope",
      "data-state": "held",
      id: "dd-1",
      title: "Rope",
      "aria-current": "page",
      "aria-selected": "true",
      "aria-pressed": "false",
      "aria-controls": "dd-2",
      "aria-haspopup": "listbox",
      "aria-labelledby": "dd-3",
      "aria-hidden": "true",
    });
  });

  it("writes a link's address as # only, and hides an element marked hidden", () => {
    const into = root();
    mountTree(new Div({}, [new Anchor({ text: "Mira" }), new Span({ hidden: true, text: "x" })]), into);
    expect(into.querySelector("a")?.getAttribute("href")).toBe("#");
    expect((into.querySelector("span") as HTMLElement).style.display).toBe("none");
  });

  it("runs a press here, or in a new tab with the key held", () => {
    const into = root();
    const action = actionSpy();
    mountTree(new Button({ text: "Open", bindings: [new PressBinding(action)] }), into);
    const button = into.querySelector("button")!;
    const view = button.ownerDocument.defaultView!;
    button.dispatchEvent(new view.MouseEvent("click"));
    button.dispatchEvent(new view.MouseEvent("click", { ctrlKey: true }));
    expect(action.run.mock.calls).toEqual([[HERE], [NEW_TAB]]);
  });

  it("runs a key binding only for its keys on the element itself, keeping the key from doing more", () => {
    const into = root();
    const action = actionSpy();
    mountTree(new Div({ role: "button", tabIndex: 0, bindings: [new KeyBinding(["Enter", " "], action)] }, [new Span({ text: "inner" })]), into);
    const row = into.firstElementChild as HTMLElement;
    const view = row.ownerDocument.defaultView!;
    const enter = new view.KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    row.dispatchEvent(enter);
    row.dispatchEvent(new view.KeyboardEvent("keydown", { key: "a" }));
    row.querySelector("span")!.dispatchEvent(new view.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(action.run.mock.calls).toEqual([[HERE]]);
    expect(enter.defaultPrevented).toBe(true);
  });

  it("tells a field's binding what is typed or chosen, with the value written in place first", () => {
    const into = root();
    const typed: string[] = [];
    const field = { changed: (value: string) => void typed.push(value) };
    mountTree(new Div({}, [new TextInput({ value: "Rope", placeholder: "Name", bindings: [new ChangeBinding(field)] }), new TextArea({ value: "Lines", spellcheck: false, bindings: [new ChangeBinding(field)] }, 4), new Select({ bindings: [new ChangeBinding(field)] }, [new Option({ text: "Held" }, "held"), new Option({ text: "Sold" }, "sold")])]), into);
    const input = into.querySelector("input")!;
    const area = into.querySelector("textarea")!;
    const select = into.querySelector("select")!;
    expect([input.value, input.placeholder, area.value, area.getAttribute("rows"), area.spellcheck]).toEqual(["Rope", "Name", "Lines", "4", false]);
    const view = input.ownerDocument.defaultView!;
    input.value = "Torch";
    input.dispatchEvent(new view.Event("input"));
    select.value = "sold";
    select.dispatchEvent(new view.Event("change"));
    expect(typed).toEqual(["Torch", "sold"]);
  });

  it("hands over a handle for the few live changes: focus, hide, open, select, words and a new tree", () => {
    const into = root();
    let handle: ElementHandle | null = null;
    const wanted = { received: (given: ElementHandle) => void (handle = given) };
    mountTree(new Details({ bindings: [new HandleRequest(wanted)] }, [new Summary({ text: "Gone" })]), into);
    const details = into.querySelector("details")!;
    handle!.setOpen(true);
    handle!.setSelected(true);
    expect([details.open, details.getAttribute("aria-selected")]).toEqual([true, "true"]);
    handle!.replaceWith(new Paragraph({ text: "Nothing gone." }));
    expect(details.innerHTML).toBe("<p>Nothing gone.</p>");
    handle!.setHidden(true);
    expect(handle!.isShown()).toBe(false);
    handle!.setText("Gone 2");
    expect(details.textContent).toBe("Gone 2");
  });

  it("refuses a place it didn't make, making nothing", () => {
    expect(() => new ObsidianMounter().span(new Span({ text: "x" }), { mountPlace: true })).toThrow("isn't a place the Obsidian mount step made");
  });
});
