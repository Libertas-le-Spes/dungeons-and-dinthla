import type { ViewElement } from "../elements/view-element";

export interface PageView {
  show(trees: readonly ViewElement[]): void;
}

export interface ShownPage {
  readonly cls: readonly string[];
  opened(view: PageView): void;
  closed(): void;
}
