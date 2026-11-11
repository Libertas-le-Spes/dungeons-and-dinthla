import { Setting, type App } from "obsidian";
import type { QuestionRecord } from "../campaign/campaign";
import { isSubmit } from "../views/dialogs/keys";
import { deleteOnSecondPress } from "../views/dialogs/second-press";
import { RecordChangeDialog } from "../views/dialogs/record-change-dialog";
import type { QuestionEdit } from "./question-plan";

export interface QuestionChoices {
  save(edit: QuestionEdit): Promise<boolean>;
  reopen(): Promise<boolean>;
  delete(): Promise<boolean>;
}

export interface QuestionPlaces {
  askedIn: string;
  answeredIn: string;
  writesTo: string;
}

const FAILURE = "Couldn't change the question";

export class QuestionModal extends RecordChangeDialog {
  private readonly edit: QuestionEdit;

  constructor(
    app: App,
    private readonly question: QuestionRecord,
    private readonly places: QuestionPlaces,
    private readonly choices: QuestionChoices,
    onClosed: (changed: boolean) => void,
  ) {
    super(app, onClosed);
    let answer = "";
    if (question.answer !== null) answer = question.answer.text;
    this.edit = { answer, followUp: "" };
  }

  override onOpen(): void {
    const { contentEl } = this;
    if (this.question.answer === null) this.setTitle("Answer the question");
    else this.setTitle("Answered question");
    contentEl.addClass("dd-tokens", "dd-dialog");
    contentEl.createEl("p", { cls: "dd-subject", text: this.question.text });
    contentEl.createEl("p", { cls: "dd-detail", text: `Asked in ${this.places.askedIn}` });
    new Setting(contentEl).setName("Answer").addTextArea((area) => {
      area.setPlaceholder("Lady Vess sent it, through [[Mira]]").setValue(this.edit.answer).onChange((value) => {
        this.edit.answer = value;
      });
      area.inputEl.setAttr("aria-label", "Answer");
      area.inputEl.addEventListener("keydown", (event) => {
        if (!isSubmit(event, true)) return;
        event.preventDefault();
        this.runChange(() => this.choices.save(this.edit), FAILURE);
      });
      area.inputEl.focus();
    });
    new Setting(contentEl).setName("Follow-up question (optional)").addText((text) => {
      text.setPlaceholder("Why would she hide it?").onChange((value) => {
        this.edit.followUp = value;
      });
      text.inputEl.setAttr("aria-label", "Follow-up question");
      text.inputEl.addEventListener("keydown", (event) => {
        if (!isSubmit(event, false)) return;
        event.preventDefault();
        this.runChange(() => this.choices.save(this.edit), FAILURE);
      });
    });
    let where = `New lines go into ${this.places.writesTo}.`;
    if (this.question.answer !== null) where = `New lines go into ${this.places.writesTo}; a changed answer replaces the old one in ${this.places.answeredIn}.`;
    contentEl.createEl("p", { cls: "dd-where", text: where });
    const buttons = new Setting(contentEl);
    buttons.addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.runChange(() => this.choices.save(this.edit), FAILURE)));
    if (this.question.answer !== null) {
      buttons.addButton((button) => button.setButtonText("Reopen question").onClick(() => this.runChange(() => this.choices.reopen(), FAILURE)));
    }
    buttons.addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
    buttons.addButton((button) => {
      this.stopOnClose(deleteOnSecondPress(button, "Delete question", () => this.runChange(() => this.choices.delete(), FAILURE)));
    });
  }
}
