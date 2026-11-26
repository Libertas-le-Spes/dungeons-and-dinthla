import { MAKE_MAIN_WORDS } from "../../../imports/layout/standing";
import { ActionButton, type ButtonAction } from "../../../views/components/buttons/action-button";
import type { ViewElement } from "../../../views/elements/view-element";

const MAKE_MAIN_CLASSES = ["dd-create", "dd-make-main"];

export interface MakeMainAction {
  makeMain(path: string, returnFocus: () => void): void;
}

class MakeMainRun implements ButtonAction {
  constructor(
    private readonly path: string,
    private readonly action: MakeMainAction,
  ) {}

  run(returnFocus: () => void): void {
    this.action.makeMain(this.path, returnFocus);
  }
}

export function makeMainButton(path: string, action: MakeMainAction): ViewElement {
  return new ActionButton(MAKE_MAIN_WORDS, MAKE_MAIN_CLASSES, new MakeMainRun(path, action)).build();
}
