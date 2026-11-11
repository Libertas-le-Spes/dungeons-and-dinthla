const EDIT_ALL = "Edit all";
const EDIT_ALL_NOT_SAVED = "Edit all (not saved)";

export interface NotesButtonMoves {
  editAll(): void;
  clearNotes(): void;
  deleteSession(): void;
}

export class NotesButtons {
  private readonly editAllButton: HTMLButtonElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly deleteButton: HTMLButtonElement;
  private readonly message: HTMLElement;

  constructor(head: HTMLElement, moves: NotesButtonMoves) {
    const row = head.createDiv({ cls: "dd-notes-actions" });
    this.editAllButton = row.createEl("button", { cls: "dd-create dd-edit-all", text: EDIT_ALL });
    this.clearButton = row.createEl("button", { cls: "dd-create dd-clear-notes", text: "Clear notes" });
    this.deleteButton = row.createEl("button", { cls: "mod-warning dd-delete-session", text: "Delete session" });
    this.message = head.createEl("p", { cls: "dd-notes-message", attr: { "aria-live": "polite" } });
    this.editAllButton.addEventListener("click", () => moves.editAll());
    this.clearButton.addEventListener("click", () => moves.clearNotes());
    this.deleteButton.addEventListener("click", () => moves.deleteSession());
  }

  setEditsNotSaved(notSaved: boolean): void {
    if (notSaved) this.editAllButton.setText(EDIT_ALL_NOT_SAVED);
    else this.editAllButton.setText(EDIT_ALL);
  }

  setRemovable(lineCount: number, busy: boolean): void {
    this.clearButton.disabled = busy || lineCount === 0;
    this.deleteButton.disabled = busy;
  }

  say(message: string): void {
    this.message.setText(message);
  }
}
