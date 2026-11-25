import type { ViewElement } from "../../../views/elements/view-element";
import type { ImportedLists } from "../lists/imported-lists";

export interface SheetPanel {
  treeOf(lists: ImportedLists): ViewElement;
}
