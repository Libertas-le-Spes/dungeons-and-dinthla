import type { WorkspaceLeaf } from "obsidian";
import type { EditorStep } from "./editor-step";

export const EDIT_NOTE = "Edit note";
export const EDIT_NOTE_CLASS = "dd-edit-note";

class EditNoteButton {
  constructor(
    private readonly step: EditorStep,
    private readonly path: string,
    private readonly leaf: WorkspaceLeaf,
  ) {}

  drawIn(rowEl: HTMLElement): void {
    const button = rowEl.createEl("button", { cls: EDIT_NOTE_CLASS, text: EDIT_NOTE });
    button.addEventListener("click", this.open.bind(this));
  }

  private open(): void {
    this.step.openIn(this.path, this.leaf);
  }
}

export function drawEditNoteButton(rowEl: HTMLElement, step: EditorStep, shownPath: string | null, leaf: WorkspaceLeaf): void {
  const path = step.noteOf(shownPath);
  if (path === null) return;
  const button = new EditNoteButton(step, path, leaf);
  button.drawIn(rowEl);
}
