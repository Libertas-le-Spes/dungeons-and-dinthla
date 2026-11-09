const EDIT_ALL = "Edit all";
const EDIT_ALL_NOT_SAVED = "Edit all (not saved)";

export interface NotesButtonMoves {
  editAll(): void;
}

export class NotesButtons {
  private readonly editAllButton: HTMLButtonElement;

  constructor(head: HTMLElement, moves: NotesButtonMoves) {
    const row = head.createDiv({ cls: "dd-notes-actions" });
    this.editAllButton = row.createEl("button", { cls: "dd-create dd-edit-all", text: EDIT_ALL });
    this.editAllButton.addEventListener("click", () => moves.editAll());
  }

  setEditsNotSaved(notSaved: boolean): void {
    if (notSaved) this.editAllButton.setText(EDIT_ALL_NOT_SAVED);
    else this.editAllButton.setText(EDIT_ALL);
  }
}
