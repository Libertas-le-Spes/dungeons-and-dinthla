import { DEPART_WORDS } from "../../../imports/layout/standing";
import type { FocusAfter } from "../../../views/lists/focus-after";
import { addActionButton } from "../../imported/drawing/action-button";
import type { ButtonAction } from "../../../views/components/buttons/action-button";

const DEPART_CLASSES = ["dd-depart", "mod-warning"];

export interface DepartAction {
  depart(path: string, returnFocus: () => void): void;
}

export interface DepartButton {
  readonly parent: HTMLElement;
  readonly path: string;
  readonly action: DepartAction;
  readonly focus: FocusAfter;
}

class DepartRun implements ButtonAction {
  constructor(private readonly button: DepartButton) {}

  run(returnFocus: () => void): void {
    const { action, path, focus } = this.button;
    action.depart(path, () => {
      returnFocus();
      focus.arm();
    });
  }
}

export function addDepartButton(button: DepartButton): void {
  addActionButton(button.parent, DEPART_WORDS, DEPART_CLASSES, new DepartRun(button));
}
