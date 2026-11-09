import { NoteEditing, type NoteEditingNeeds } from "../note-editing/note-editing";

const TITLE = "Notes · Edit all";
const DONE = "Done";
export const NOT_SAVED_YET =
  "What you changed here isn't saved yet. It stays on this device, and shows again the next time you press Edit all. If you add lines to the session before saving it, the note will have changed since, and you'll need to copy your change out and make it again.";
const KEEP_EDITING = "Keep editing";
const LEAVE = "Back to adding lines";

export class EditAllPanel {
  private readonly panel: HTMLElement;
  private readonly leaving: HTMLElement;
  private readonly keepButton: HTMLButtonElement;
  private readonly body: HTMLElement;
  private editing: NoteEditing | null = null;

  constructor(
    parent: HTMLElement,
    private readonly path: string,
    private readonly needs: NoteEditingNeeds,
    private readonly left: () => void,
  ) {
    this.panel = parent.createEl("section", { cls: "dd-notes-panel dd-edit-all-panel" });
    const head = this.panel.createDiv({ cls: "dd-head" });
    head.createEl("h2", { cls: "dd-title", text: TITLE });
    const doneButton = head.createEl("button", { cls: "dd-create dd-edit-all-done", text: DONE });
    this.leaving = this.panel.createDiv({ cls: "dd-edit-all-leaving", attr: { role: "alert" } });
    this.leaving.createEl("p", { cls: "dd-edit-all-leaving-message", text: NOT_SAVED_YET });
    this.keepButton = this.leaving.createEl("button", { cls: "mod-cta dd-keep-editing", text: KEEP_EDITING });
    const leaveButton = this.leaving.createEl("button", { cls: "dd-create dd-leave-edit-all", text: LEAVE });
    this.body = this.panel.createDiv({ cls: "dd-edit-all-body" });
    doneButton.addEventListener("click", () => this.done());
    this.keepButton.addEventListener("click", () => this.keepEditing());
    leaveButton.addEventListener("click", () => this.leave());
    this.leaving.toggle(false);
    this.panel.toggle(false);
  }

  open(): void {
    if (this.editing !== null) return;
    this.editing = new NoteEditing(this.body, this.path, this.needs, this);
    this.panel.toggle(true);
    this.editing.focus();
  }

  close(): void {
    if (this.editing === null) return;
    this.editing.close();
    this.editing = null;
    this.body.empty();
    this.leaving.toggle(false);
    this.panel.toggle(false);
  }

  textShown(_text: string, unsaved: boolean): void {
    if (!unsaved) this.leaving.toggle(false);
  }

  private done(): void {
    if (this.editing !== null && this.editing.unsaved) {
      this.leaving.toggle(true);
      this.keepButton.focus();
      return;
    }
    this.leave();
  }

  private keepEditing(): void {
    this.leaving.toggle(false);
    if (this.editing !== null) this.editing.focus();
  }

  private leave(): void {
    this.close();
    this.left();
  }
}
