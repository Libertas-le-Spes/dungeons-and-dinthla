import { NoteEditing, type NoteEditingNeeds } from "../../note-editing/note-editing";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import type { ElementBinding } from "../../views/elements/bindings/element-binding";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Heading2, Paragraph, Section } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

const TITLE = "Notes · Edit all";
const DONE = "Done";
export const NOT_SAVED_YET =
  "Not saved yet. Adding lines first loses your change.";
const KEEP_EDITING = "Keep editing";
const LEAVE = "Back to adding lines";

export class EditAllPanel {
  private readonly panel = new KeptHandle();
  private readonly leaving = new KeptHandle();
  private readonly keepButton = new KeptHandle();
  private readonly body = new KeptHandle();
  private editing: NoteEditing | null = null;

  constructor(
    private readonly path: string,
    private readonly needs: NoteEditingNeeds,
    private readonly left: () => void,
  ) {}

  tree(): ViewElement {
    const head = new Div({ cls: ["dd-head"] }, [new Heading2({ cls: ["dd-title"], text: TITLE }), this.buttonOf(["dd-create", "dd-edit-all-done"], DONE, this.done.bind(this), null)]);
    const leaving = new Div({ cls: ["dd-edit-all-leaving"], role: "alert", hidden: true, bindings: [new HandleRequest(this.leaving)] }, [
      new Paragraph({ cls: ["dd-edit-all-leaving-message"], text: NOT_SAVED_YET }),
      this.buttonOf(["mod-cta", "dd-keep-editing"], KEEP_EDITING, this.keepEditing.bind(this), this.keepButton),
      this.buttonOf(["dd-create", "dd-leave-edit-all"], LEAVE, this.leave.bind(this), null),
    ]);
    const body = new Div({ cls: ["dd-edit-all-body"], bindings: [new HandleRequest(this.body)] });
    return new Section({ cls: ["dd-notes-panel", "dd-edit-all-panel"], hidden: true, bindings: [new HandleRequest(this.panel)] }, [head, leaving, body]);
  }

  open(): void {
    if (this.editing !== null) return;
    const editing = new NoteEditing(this.path, this.needs, this);
    this.editing = editing;
    this.body.showInside(editing.trees());
    editing.start();
    this.panel.setHidden(false);
    editing.focus();
  }

  async settled(): Promise<void> {
    if (this.editing !== null) await this.editing.settled();
  }

  close(): void {
    if (this.editing === null) return;
    this.editing.close();
    this.editing = null;
    this.body.showInside([]);
    this.leaving.setHidden(true);
    this.panel.setHidden(true);
  }

  textShown(_text: string, unsaved: boolean): void {
    if (!unsaved) this.leaving.setHidden(true);
  }

  private done(): void {
    if (this.editing !== null && this.editing.unsaved) {
      this.leaving.setHidden(false);
      this.keepButton.focus();
      return;
    }
    this.leave();
  }

  private keepEditing(): void {
    this.leaving.setHidden(true);
    if (this.editing !== null) this.editing.focus();
  }

  private leave(): void {
    this.close();
    this.left();
  }

  private buttonOf(cls: string[], text: string, pressed: () => void, kept: KeptHandle | null): ViewElement {
    const bindings: ElementBinding[] = [new PressBinding(new RunAction(pressed))];
    if (kept !== null) bindings.push(new HandleRequest(kept));
    return new Button({ cls, text, bindings });
  }
}
