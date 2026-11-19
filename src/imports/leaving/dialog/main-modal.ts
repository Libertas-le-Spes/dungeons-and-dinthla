import { ButtonComponent, Setting, type App } from "obsidian";
import { RecordChangeDialog } from "../../../views/dialogs/record-change-dialog";
import type { SwitchChoice } from "../choices/switch-choice";
import { LAST_DOING_HINT, LAST_DOING_LABEL, NOT_NOW, OWN_WORDS_HINT, OWN_WORDS_LABEL, SWITCH_FAILED, type MainQuestion } from "../questions/main-question";
import type { OwnWords } from "../reasons/own-words";

interface TypedField {
  onChange(changed: (value: string) => unknown): unknown;
}

class ChoicePress {
  constructor(
    private readonly modal: MainModal,
    private readonly choice: SwitchChoice,
  ) {}

  press(): void {
    this.modal.choose(this.choice);
  }
}

export class MainModal extends RecordChangeDialog {
  private lastDoing = "";

  constructor(
    app: App,
    private readonly question: MainQuestion,
    onClosed: (changed: boolean) => void,
  ) {
    super(app, onClosed);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle(this.question.title);
    contentEl.addClass("dd-tokens", "dd-dialog");
    contentEl.createEl("p", { cls: "dd-subject", text: this.question.question });
    const ownWords = this.question.ownWords;
    if (ownWords !== null) new Setting(contentEl).setName(OWN_WORDS_LABEL).setDesc(OWN_WORDS_HINT).addText(this.keepOwnWords.bind(this, ownWords));
    if (this.question.asksLastDoing) new Setting(contentEl).setName(LAST_DOING_LABEL).setDesc(LAST_DOING_HINT).addText(this.keepField.bind(this));
    const buttons = new Setting(contentEl);
    for (const choice of this.question.choices) {
      const press = new ChoicePress(this, choice);
      new ButtonComponent(buttons.controlEl).setButtonText(choice.words).onClick(press.press.bind(press));
    }
    new ButtonComponent(buttons.controlEl).setButtonText(NOT_NOW).onClick(this.close.bind(this));
  }

  choose(choice: SwitchChoice): void {
    this.runChange(choice.run.bind(choice, this.lastDoing), SWITCH_FAILED);
  }

  private keepField(field: TypedField): void {
    field.onChange(this.keepLastDoing.bind(this));
  }

  private keepOwnWords(ownWords: OwnWords, field: TypedField): void {
    field.onChange(ownWords.keep.bind(ownWords));
  }

  private keepLastDoing(value: string): void {
    this.lastDoing = value;
  }
}
