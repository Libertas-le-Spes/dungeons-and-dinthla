import type { NoteRef } from "../../../host/notes/note-ref";
import type { ButtonAction } from "../../../views/components/buttons/action-button";
import { beyondButton } from "./beyond-button";
import type { ViewElement } from "../../../views/elements/view-element";

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

export function updateButton(file: NoteRef, action: UpdateAction): ViewElement {
  return beyondButton(UPDATE_FROM_BEYOND, new UpdateRun(file, action));
}
