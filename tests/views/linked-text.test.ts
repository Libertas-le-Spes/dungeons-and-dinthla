import { describe, expect, it, vi } from "vitest";
import { addLinkedText, addNameLink } from "../../src/views/linked-text";
import { obsidianDocument } from "./obsidian-dom";

const SOURCE = { path: "D&D/Pale Moon/Sessions/Session 1.md", line: 4 };

function linkTo(linktext: string) {
  const document = obsidianDocument();
  const parent = document.createElement("p");
  document.body.append(parent);
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  const outside = vi.fn();
  parent.addEventListener("click", outside);
  parent.addEventListener("auxclick", outside);
  parent.addEventListener("keydown", outside);
  const link = addNameLink(parent, "Mira", linktext, SOURCE, actions);
  return { document, link, actions, outside };
}

function windowOf(document: Document): Window & typeof globalThis {
  const window = document.defaultView;
  if (window === null) throw new Error("The test document has no window.");
  return window;
}

function fire(link: HTMLElement, event: Event) {
  link.dispatchEvent(event);
  return event;
}

describe("addNameLink", () => {
  it("carries no address, nor the class or data Obsidian follows links by, so nothing but the plugin acts on it", () => {
    const { link } = linkTo("Private/Primary");
    expect(link.hasAttribute("href")).toBe(false);
    expect(link.hasAttribute("data-href")).toBe(false);
    expect(link.classList.contains("internal-link")).toBe(false);
    expect(link.classList.contains("dd-link-name")).toBe(true);
  });

  it("can be reached with the keyboard as a link", () => {
    const { link } = linkTo("Mira");
    expect(link.getAttribute("role")).toBe("link");
    expect(link.getAttribute("tabindex")).toBe("0");
  });

  it.each([
    ["no key", {}, false],
    ["Ctrl", { ctrlKey: true }, "tab"],
    ["Cmd", { metaKey: true }, "tab"],
    ["Shift", { shiftKey: true }, false],
    ["Alt", { altKey: true }, false],
  ])("sends a click with %s to the fenced opener only, asking for the leaf Obsidian would use", (_name, keys, newLeaf) => {
    const { document, link, actions, outside } = linkTo("Mira");
    const event = fire(link, new (windowOf(document).MouseEvent)("click", { bubbles: true, cancelable: true, ...keys }));
    expect(actions.openLink).toHaveBeenCalledWith("Mira", SOURCE, newLeaf);
    expect(event.defaultPrevented).toBe(true);
    expect(outside).not.toHaveBeenCalled();
  });

  it("sends a middle click to the fenced opener only, asking for a new tab", () => {
    const { document, link, actions, outside } = linkTo("Mira");
    const event = fire(link, new (windowOf(document).MouseEvent)("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    expect(actions.openLink).toHaveBeenCalledWith("Mira", SOURCE, "tab");
    expect(event.defaultPrevented).toBe(true);
    expect(outside).not.toHaveBeenCalled();
  });

  it("leaves a right click to the menu", () => {
    const { document, link, actions } = linkTo("Mira");
    fire(link, new (windowOf(document).MouseEvent)("auxclick", { bubbles: true, cancelable: true, button: 2 }));
    expect(actions.openLink).not.toHaveBeenCalled();
  });

  it.each(["Enter", " "])("sends the %j key to the fenced opener only", (key) => {
    const { document, link, actions, outside } = linkTo("Mira");
    const event = fire(link, new (windowOf(document).KeyboardEvent)("keydown", { bubbles: true, cancelable: true, key }));
    expect(actions.openLink).toHaveBeenCalledWith("Mira", SOURCE, false);
    expect(event.defaultPrevented).toBe(true);
    expect(outside).not.toHaveBeenCalled();
  });

  it("leaves other keys alone", () => {
    const { document, link, actions } = linkTo("Mira");
    fire(link, new (windowOf(document).KeyboardEvent)("keydown", { bubbles: true, cancelable: true, key: "a" }));
    expect(actions.openLink).not.toHaveBeenCalled();
  });

  it("can't be dragged out", () => {
    const { document, link } = linkTo("Mira");
    expect(link.getAttribute("draggable")).toBe("false");
    const event = fire(link, new (windowOf(document).Event)("dragstart", { bubbles: true, cancelable: true }));
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("addLinkedText", () => {
  it("draws every link in the text without an address", () => {
    const document = obsidianDocument();
    const parent = document.createElement("p");
    addLinkedText(parent, "[[Mira]] met [[Private/Primary|someone]]", [], SOURCE, { openRow: vi.fn(), openLink: vi.fn() });
    const names = Array.from(parent.querySelectorAll("a"));
    expect(names).toHaveLength(2);
    for (const name of names) expect(name.hasAttribute("href")).toBe(false);
  });
});
