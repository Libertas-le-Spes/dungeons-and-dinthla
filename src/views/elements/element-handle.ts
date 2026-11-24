import type { ViewElement } from "./view-element";

export interface ElementHandle {
  focus(): void;
  setHidden(hidden: boolean): void;
  setOpen(open: boolean): void;
  setSelected(selected: boolean): void;
  setText(text: string): void;
  setClassOn(name: string, on: boolean): void;
  setValue(value: string): void;
  setTabIndex(index: number): void;
  replaceWith(tree: ViewElement): void;
  isShown(): boolean;
}
