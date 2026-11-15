import { DIED_WORDS } from "../../imports/layout/standing";
import { addActionButton, type ButtonAction } from "../imported/drawing/action-button";

const DIED_CLASSES = ["dd-create", "dd-died", "mod-warning"];

export interface DiedAction {
  died(path: string, returnFocus: () => void): void;
}

class DiedRun implements ButtonAction {
  constructor(
    private readonly path: string,
    private readonly action: DiedAction,
  ) {}

  run(returnFocus: () => void): void {
    this.action.died(this.path, returnFocus);
  }
}

export function addDiedButton(parent: HTMLElement, path: string, action: DiedAction): void {
  addActionButton(parent, DIED_WORDS, DIED_CLASSES, new DiedRun(path, action));
}
