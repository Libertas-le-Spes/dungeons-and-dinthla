import { addActionButton, type ButtonAction } from "../imported/drawing/action-button";

export const MAKE_MAIN = "Make main";

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

export function addMakeMainButton(parent: HTMLElement, path: string, action: MakeMainAction): void {
  addActionButton(parent, MAKE_MAIN, MAKE_MAIN_CLASSES, new MakeMainRun(path, action));
}
