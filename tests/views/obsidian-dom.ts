import { Window } from "happy-dom";

interface ElementInfo {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string>;
  href?: string;
  type?: string;
  placeholder?: string;
}

function applyInfo(element: HTMLElement, info: ElementInfo | string | undefined): void {
  if (info === undefined) return;
  if (typeof info === "string") {
    element.className = info;
    return;
  }
  if (info.cls !== undefined) element.className = [info.cls].flat().join(" ");
  if (info.text !== undefined) element.textContent = info.text;
  if (info.attr !== undefined) {
    for (const [name, value] of Object.entries(info.attr)) element.setAttribute(name, value);
  }
  for (const name of ["href", "type", "placeholder"] as const) {
    const value = info[name];
    if (value !== undefined) element.setAttribute(name, value);
  }
}

function create(parent: HTMLElement, tag: string, info?: ElementInfo | string): HTMLElement {
  const element = parent.ownerDocument.createElement(tag);
  applyInfo(element, info);
  parent.append(element);
  return element;
}

export function obsidianDocument(): Document {
  const window = new Window();
  const prototype = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  prototype.createEl = function (this: HTMLElement, tag: string, info?: ElementInfo | string) {
    return create(this, tag, info);
  };
  prototype.createSpan = function (this: HTMLElement, info?: ElementInfo | string) {
    return create(this, "span", info);
  };
  prototype.createDiv = function (this: HTMLElement, info?: ElementInfo | string) {
    return create(this, "div", info);
  };
  prototype.appendText = function (this: HTMLElement, text: string) {
    this.append(this.ownerDocument.createTextNode(text));
  };
  prototype.addClass = function (this: HTMLElement, ...names: string[]) {
    this.classList.add(...names);
  };
  prototype.empty = function (this: HTMLElement) {
    this.replaceChildren();
  };
  prototype.setText = function (this: HTMLElement, text: string) {
    this.textContent = text;
  };
  return window.document as unknown as Document;
}
