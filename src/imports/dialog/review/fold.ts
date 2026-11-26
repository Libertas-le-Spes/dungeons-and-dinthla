import { Folded } from "../../../views/components/layout/folded";
import type { ViewElement } from "../../../views/elements/view-element";

export function foldOf(title: string, inside: ViewElement): ViewElement {
  return new Folded(["dd-import-fold"], title).build([inside]);
}
