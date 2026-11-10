import { Setting, type App, type ButtonComponent } from "obsidian";
import { CHANGED_IN_NOTE, PartlyWritten } from "../campaign/note-editor";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";
import { SecondPress } from "../views/second-press";
import { ChangeDialog } from "../views/change-dialog";
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
const PRESS_AGAIN = "Press again to delete";

const PLACEHOLDERS: Record<keyof CharacterEntry, string> = {
  name: "Brother Aldric",
  type: "Medium humanoid (human), lawful good",
  subtitle: "Human Cleric 5",
  speed: "30 ft.",
};

export class CharacterModal extends ChangeDialog {
  private readonly entry: CharacterEntry;
  private nameInput: HTMLInputElement | null = null;

  constructor(
    app: App,
    private readonly dialog: CharacterDialog,
    private readonly onClosed: () => void,
  ) {
    super(app);
    this.entry = { ...dialog.entry };
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle(this.dialog.title);
    contentEl.addClass("dd-tokens", "dd-dialog");
    this.addField("name", "Name");
    for (const { fact, label } of ENTRY_FIELDS) this.addLearned(this.addField(fact, label), fact);
    contentEl.createEl("p", { cls: "dd-where", text: this.dialog.where });
    const buttons = new Setting(contentEl);
    buttons.addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.save()));
    buttons.addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
    const deleteNote = this.dialog.delete;
    if (deleteNote !== null) buttons.addButton((button) => this.addDelete(button, deleteNote));
  }

  protected override closed(): void {
    this.onClosed();
  }

  protected override finished(wrote: boolean): void {
    if (wrote) this.close();
    else if (this.nameInput !== null) this.nameInput.focus();
  }

  protected override failed(error: unknown): void {
    if (error instanceof PartlyWritten || OUT_OF_DATE.includes(messageOf(error))) this.close();
  }

  private addLearned(setting: Setting, fact: EntryFact): void {
    const learned = this.dialog.learned.get(fact);
    if (learned !== undefined) setting.setDesc(`Learned in the sessions: ${learned}`);
  }

  private addField(field: keyof CharacterEntry, label: string): Setting {
    return new Setting(this.contentEl).setName(label).addText((text) => {
      text.setPlaceholder(PLACEHOLDERS[field]).setValue(this.entry[field]).onChange((value) => {
        this.entry[field] = value;
      });
      text.inputEl.setAttr("aria-label", label);
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || !isSubmit(event, false)) return;
        event.preventDefault();
        this.save();
      });
      if (field !== "name") return;
      this.nameInput = text.inputEl;
      text.inputEl.focus();
    });
  }

  private addDelete(button: ButtonComponent, deleteNote: () => Promise<void>): void {
    const showArmed = (armed: boolean) => {
      if (armed) button.setButtonText(PRESS_AGAIN);
      else button.setButtonText(DELETE);
    };
    const secondPress = new SecondPress(showArmed, () => this.runChange(async () => {
      await deleteNote();
      return true;
    }, "Couldn't delete the character"));
    this.stopOnClose(secondPress);
    button.setButtonText(DELETE).setWarning().onClick(() => secondPress.press());
    button.buttonEl.addClass("dd-delete");
  }

  private save(): void {
    this.runChange(() => this.dialog.save(trimmedEntry(this.entry)), "Couldn't save the character");
  }
}
