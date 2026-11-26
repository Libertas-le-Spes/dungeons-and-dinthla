import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

const EDIT_ALL = "Edit all";
const EDIT_ALL_NOT_SAVED = "Edit all (not saved)";

export interface NotesButtonMoves {
  editAll(): void;
  clearNotes(): void;
  deleteSession(): void;
}

export class NotesButtons {
  private readonly editAllButton = new KeptHandle();
  private readonly clearButton = new KeptHandle();
  private readonly deleteButton = new KeptHandle();
  private readonly message = new KeptHandle();

  constructor(private readonly moves: NotesButtonMoves) {}

  trees(): ViewElement[] {
    const row = new Div({ cls: ["dd-notes-actions"] }, [
      this.buttonOf(["dd-create", "dd-edit-all"], EDIT_ALL, this.editAll.bind(this), this.editAllButton),
      this.buttonOf(["dd-create", "dd-clear-notes"], "Clear notes", this.clearNotes.bind(this), this.clearButton),
      this.buttonOf(["mod-warning", "dd-delete-session"], "Delete session", this.deleteSession.bind(this), this.deleteButton),
    ]);
    return [row, new Paragraph({ cls: ["dd-notes-message"], live: "polite", bindings: [new HandleRequest(this.message)] })];
  }

  setEditsNotSaved(notSaved: boolean): void {
    if (notSaved) this.editAllButton.setText(EDIT_ALL_NOT_SAVED);
    else this.editAllButton.setText(EDIT_ALL);
  }

  setRemovable(lineCount: number, busy: boolean): void {
    this.clearButton.setDisabled(busy || lineCount === 0);
    this.deleteButton.setDisabled(busy);
  }

  say(message: string): void {
    this.message.setText(message);
  }

  private buttonOf(cls: string[], text: string, pressed: () => void, kept: KeptHandle): ViewElement {
    return new Button({ cls, text, bindings: [new PressBinding(new RunAction(pressed)), new HandleRequest(kept)] });
  }

  private editAll(): void {
    this.moves.editAll();
  }

  private clearNotes(): void {
    this.moves.clearNotes();
  }

  private deleteSession(): void {
    this.moves.deleteSession();
  }
}
