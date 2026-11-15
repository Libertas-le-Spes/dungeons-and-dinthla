export const EDIT_ALL_WAITING = "Save your Edit all change first.";

export class EditAllReminder {
  private readonly note: HTMLElement;

  constructor(parent: HTMLElement) {
    this.note = parent.createEl("p", { cls: "dd-edit-all-reminder", text: EDIT_ALL_WAITING });
    this.note.toggle(false);
  }

  setShown(shown: boolean): void {
    this.note.toggle(shown);
  }
}
