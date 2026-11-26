import type { DialogView } from "../../../views/dialogs/dialog-view";
import type { ViewElement } from "../../../views/elements/view-element";

export class StageScreen {
  private view: DialogView | null = null;

  attach(view: DialogView): void {
    this.view = view;
  }

  show(trees: ViewElement[]): void {
    if (this.view !== null) this.view.show(trees);
  }
}
