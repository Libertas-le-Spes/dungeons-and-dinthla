import { DEPART_WORDS } from "../../../imports/layout/standing";
import type { FocusAfter } from "../../../views/lists/focus-after";
import { ActionButton, type ButtonAction } from "../../../views/components/buttons/action-button";
import type { ViewElement } from "../../../views/elements/view-element";

const DEPART_CLASSES = ["dd-depart", "mod-warning"];

export interface DepartAction {
  depart(path: string, returnFocus: () => void): void;
}

class DepartClosed {
  constructor(
    private readonly returnFocus: () => void,
    private readonly focus: FocusAfter,
  ) {}

  closed(): void {
    this.returnFocus();
    this.focus.arm();
  }
}

class DepartRun implements ButtonAction {
  constructor(
    private readonly path: string,
    private readonly action: DepartAction,
    private readonly focus: FocusAfter,
  ) {}

  run(returnFocus: () => void): void {
    const closing = new DepartClosed(returnFocus, this.focus);
    this.action.depart(this.path, closing.closed.bind(closing));
  }
}

export function departButton(path: string, action: DepartAction, focus: FocusAfter): ViewElement {
  return new ActionButton(DEPART_WORDS, DEPART_CLASSES, new DepartRun(path, action, focus)).build();
}
