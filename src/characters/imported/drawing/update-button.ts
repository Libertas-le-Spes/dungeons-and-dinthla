import type { TFile } from "obsidian";
import type { ButtonAction } from "./action-button";
import { addBeyondButton } from "./beyond-button";

export const UPDATE_FROM_BEYOND = "Update from D&D Beyond";

export interface UpdateAction {
  updateFromBeyond(file: TFile, returnFocus: () => void): void;
}

class UpdateRun implements ButtonAction {
  constructor(
    private readonly file: TFile,
    private readonly action: UpdateAction,
  ) {}

  run(returnFocus: () => void): void {
    this.action.updateFromBeyond(this.file, returnFocus);
  }
}

export function addUpdateButton(head: HTMLElement, file: TFile, action: UpdateAction): void {
  addBeyondButton(head, UPDATE_FROM_BEYOND, new UpdateRun(file, action));
}
