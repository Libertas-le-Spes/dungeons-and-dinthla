import type { NoteRef } from "../../../host/notes/note-ref";
import type { ButtonAction } from "./action-button";
import { addBeyondButton } from "./beyond-button";

export const UPDATE_FROM_BEYOND = "Update from D&D Beyond";

export interface UpdateAction {
  updateFromBeyond(file: NoteRef, returnFocus: () => void): void;
}

class UpdateRun implements ButtonAction {
  constructor(
    private readonly file: NoteRef,
    private readonly action: UpdateAction,
  ) {}

  run(returnFocus: () => void): void {
    this.action.updateFromBeyond(this.file, returnFocus);
  }
}

export function addUpdateButton(head: HTMLElement, file: NoteRef, action: UpdateAction): void {
  addBeyondButton(head, UPDATE_FROM_BEYOND, new UpdateRun(file, action));
}
