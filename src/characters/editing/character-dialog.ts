import type { Telling } from "../../host/showing/telling";
import { CHANGED_IN_NOTE, PartlyWritten } from "../../campaign/writing/note-editor";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { DeleteButton } from "../../views/components/dialogs/delete-button";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { TextField } from "../../views/components/dialogs/text-field";
import { ChangeWork, type ChangeEnds } from "../../views/dialogs/change-work";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { messageOf } from "../../views/dialogs/message-of";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { NOTE_MOVED } from "./character-files";
import { ENTRY_FIELDS, trimmedEntry, type CharacterEntry, type EntryFact, type Learned } from "./character-entry";

export interface CharacterDialog {
  title: string;
  entry: CharacterEntry;
  learned: Learned;
  where: string;
  save(entry: CharacterEntry): Promise<boolean>;
  delete: (() => Promise<void>) | null;
}

const DELETE = "Delete character";
const OUT_OF_DATE = [CHANGED_IN_NOTE, NOTE_MOVED];
const DIALOG_CLASSES = ["dd-dialog"];

const PLACEHOLDERS: Record<keyof CharacterEntry, string> = {
  name: "Brother Aldric",
  type: "Medium humanoid (human), lawful good",
  subtitle: "Human Cleric 5",
  speed: "30 ft.",
};

class EntryChange implements TextChange {
  constructor(
    private readonly entry: CharacterEntry,
    private readonly field: keyof CharacterEntry,
  ) {}

  changed(value: string): void {
    this.entry[this.field] = value;
  }
}

export class CharacterEditDialog implements ShownDialog, ChangeEnds {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly entry: CharacterEntry;
  private readonly work: ChangeWork;
  private readonly nameHandle = new KeptHandle();
  private readonly deleting: DeleteButton;
  private view: DialogView | null = null;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly dialog: CharacterDialog,
    private readonly onClosed: () => void,
  ) {
    this.title = dialog.title;
    this.entry = { ...dialog.entry };
    this.work = new ChangeWork(telling, this);
    this.deleting = new DeleteButton(DELETE, new RunAction(this.deleteNote.bind(this)));
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    this.nameHandle.focus();
  }

  mayClose(): boolean {
    return !this.work.isBusy();
  }

  closed(): void {
    this.deleting.stop();
    this.onClosed();
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  finished(wrote: boolean): void {
    if (wrote) this.close();
    else this.nameHandle.focus();
  }

  failed(error: unknown): void {
    if (error instanceof PartlyWritten || OUT_OF_DATE.includes(messageOf(error))) this.close();
  }

  private trees(): ViewElement[] {
    const save = new RunAction(this.save.bind(this));
    const trees: ViewElement[] = [this.field("name", "Name", save).build(this.entry.name, this.nameHandle)];
    for (const { fact, label } of ENTRY_FIELDS) trees.push(this.field(fact, label, save).described(this.entry[fact], this.learnedWords(fact), null));
    trees.push(new Paragraph({ cls: ["dd-where"], text: this.dialog.where }), new ButtonRow().build(this.buttons(save)));
    return trees;
  }

  private field(field: keyof CharacterEntry, label: string, save: RunAction): TextField {
    return new TextField({ name: label, label, placeholder: PLACEHOLDERS[field] }, new EntryChange(this.entry, field), save);
  }

  private learnedWords(fact: EntryFact): string | null {
    const learned = this.dialog.learned.get(fact);
    if (learned === undefined) return null;
    return `Learned in the sessions: ${learned}`;
  }

  private buttons(save: RunAction): ViewElement[] {
    const buttons: ViewElement[] = [new MainButton("Save", save).build(), new PlainButton("Cancel", new RunAction(this.close.bind(this))).build()];
    if (this.dialog.delete !== null) buttons.push(this.deleting.build());
    return buttons;
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }

  private save(): void {
    this.work.run(this.dialog.save.bind(this.dialog, trimmedEntry(this.entry)), "Couldn't save the character");
  }

  private deleteNote(): void {
    this.work.run(this.deletedNote.bind(this), "Couldn't delete the character");
  }

  private async deletedNote(): Promise<boolean> {
    if (this.dialog.delete !== null) await this.dialog.delete();
    return true;
  }
}
