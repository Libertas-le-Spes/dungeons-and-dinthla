import type { ElementHandle } from "../../../views/elements/element-handle";
import type { ViewElement } from "../../../views/elements/view-element";
import { ElementPlace } from "./element-place";
import { isButton, isField } from "./field-element";
import type { MountKit } from "./mount-kit";
import { ObsidianMounter } from "./obsidian-mounter";

function isDetails(el: HTMLElement): el is HTMLDetailsElement {
  return el.tagName === "DETAILS";
}

export class ObsidianHandle implements ElementHandle {
  constructor(
    private readonly el: HTMLElement,
    private readonly kit: MountKit,
  ) {}

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

  setClassOn(name: string, on: boolean): void {
    this.el.toggleClass(name, on);
  }

  setValue(value: string): void {
    if (isField(this.el)) this.el.value = value;
  }

  setDisabled(disabled: boolean): void {
    if (isButton(this.el)) this.el.disabled = disabled;
  }

  setTabIndex(index: number): void {
    this.el.setAttr("tabindex", String(index));
  }

  showInside(trees: readonly ViewElement[]): void {
    this.el.empty();
    const mounter = new ObsidianMounter(this.kit);
    for (const tree of trees) tree.mountOn(mounter, new ElementPlace(this.el));
  }

  isShown(): boolean {
    return this.el.isShown();
  }
}
