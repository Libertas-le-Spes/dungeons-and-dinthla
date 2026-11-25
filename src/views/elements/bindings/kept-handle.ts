import type { ElementHandle } from "../element-handle";
import type { HandleWanted } from "./binding-wiring";
import type { ViewElement } from "../view-element";

export class KeptHandle implements HandleWanted {
  handle: ElementHandle | null = null;

  received(handle: ElementHandle): void {
    this.handle = handle;
  }

  focus(): void {
    if (this.handle !== null) this.handle.focus();
  }

  setText(text: string): void {
    if (this.handle !== null) this.handle.setText(text);
  }

  setDisabled(disabled: boolean): void {
    if (this.handle !== null) this.handle.setDisabled(disabled);
  }

  setReadOnly(readOnly: boolean): void {
    if (this.handle !== null) this.handle.setReadOnly(readOnly);
  }

  placeCaret(at: number): void {
    if (this.handle !== null) this.handle.placeCaret(at);
  }

  bringIntoView(): void {
    if (this.handle !== null) this.handle.bringIntoView();
  }

  setSelected(selected: boolean): void {
    if (this.handle !== null) this.handle.setSelected(selected);
  }

  setLabel(label: string): void {
    if (this.handle !== null) this.handle.setLabel(label);
  }

  setValue(value: string): void {
    if (this.handle !== null) this.handle.setValue(value);
  }

  setClassOn(name: string, on: boolean): void {
    if (this.handle !== null) this.handle.setClassOn(name, on);
  }

  setOpen(open: boolean): void {
    if (this.handle !== null) this.handle.setOpen(open);
  }

  setHidden(hidden: boolean): void {
    if (this.handle !== null) this.handle.setHidden(hidden);
  }

  showInside(trees: readonly ViewElement[]): void {
    if (this.handle !== null) this.handle.showInside(trees);
  }
}
