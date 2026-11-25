import type { ViewElement } from "../elements/view-element";

export interface PagePart {
  tree(): ViewElement;
  started(): void;
  stopped(): void;
}
