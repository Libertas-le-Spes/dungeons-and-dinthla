import type { ViewElement } from "../../../views/elements/view-element";

export interface OnlineBlock {
  tree(): ViewElement;
  focus(): void;
}
