import { DIED_WORDS } from "../../imports/layout/standing";
import type { FocusAfter } from "../../views/lists/focus-after";
import { addActionButton, type ButtonAction } from "../imported/drawing/action-button";

const DIED_CLASSES = ["dd-create", "dd-died", "mod-warning"];

export interface DiedAction {
  died(path: string, returnFocus: () => void): void;
}

export interface DiedButton {
  readonly parent: HTMLElement;
  readonly path: string;
  readonly action: DiedAction;
  readonly focus: FocusAfter;
}

class DiedRun implements ButtonAction {
  constructor(private readonly button: DiedButton) {}

  run(returnFocus: () => void): void {
    const { action, path, focus } = this.button;
    action.died(path, () => {
      returnFocus();
      focus.arm();
    });
  }
}

export function addDiedButton(button: DiedButton): void {
  addActionButton(button.parent, DIED_WORDS, DIED_CLASSES, new DiedRun(button));
}
