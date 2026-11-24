import type { ElementHandle } from "../../../views/elements/element-handle";
import type { ViewElement } from "../../../views/elements/view-element";
import { ElementPlace } from "./element-place";
import { ObsidianMounter } from "./obsidian-mounter";

function isDetails(el: HTMLElement): el is HTMLDetailsElement {
  return el.tagName === "DETAILS";
}

export class ObsidianHandle implements ElementHandle {
  constructor(private readonly el: HTMLElement) {}

  focus(): void {
    this.el.focus();
  }

  setHidden(hidden: boolean): void {
    this.el.toggle(!hidden);
  }

  setOpen(open: boolean): void {
    if (isDetails(this.el)) this.el.open = open;
  }

  setSelected(selected: boolean): void {
    this.el.setAttr("aria-selected", String(selected));
  }

  setText(text: string): void {
    this.el.setText(text);
  }

  setTabIndex(index: number): void {
    this.el.setAttr("tabindex", String(index));
  }

  replaceWith(tree: ViewElement): void {
    this.el.empty();
    tree.mountOn(new ObsidianMounter(), new ElementPlace(this.el));
  }

  isShown(): boolean {
    return this.el.isShown();
  }
}
