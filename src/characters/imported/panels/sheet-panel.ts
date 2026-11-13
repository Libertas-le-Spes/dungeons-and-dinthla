import type { ImportedLists } from "../lists/imported-lists";

export interface SheetPanel {
  addTo(root: HTMLElement, lists: ImportedLists): void;
}
