import type { Telling } from "../../host/showing/telling";
import type { ViewElement } from "../elements/view-element";

export interface DialogView {
  show(trees: readonly ViewElement[]): void;
  close(): void;
}

export interface ShownDialog {
  readonly title: string;
  readonly cls: readonly string[];
  opened(view: DialogView): void;
  mayClose(): boolean;
  closed(): void;
}

export interface Dialogs {
  open(dialog: ShownDialog): void;
}

export interface DialogShowing {
  readonly dialogs: Dialogs;
  readonly telling: Pick<Telling, "say">;
}
