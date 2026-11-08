import { Modal, Notice, Setting, type App, type ButtonComponent } from "obsidian";
import type { QuestionRecord } from "../campaign/campaign";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";
import { PartlyWritten } from "../campaign/note-editor";
import type { QuestionEdit } from "./question-writer";

export interface QuestionChoices {
  save(edit: QuestionEdit): Promise<boolean>;
  reopen(): Promise<boolean>;
  delete(): Promise<boolean>;
}

export interface QuestionPlaces {
  askedIn: string;
  writesTo: string;
}

const CONFIRM_MS = 4000;

export class QuestionModal extends Modal {
  private readonly edit: QuestionEdit;
  private confirmTimer: number | null = null;
  private changed = false;
  private busy = false;

  constructor(
    app: App,
    private readonly question: QuestionRecord,
    private readonly places: QuestionPlaces,
    private readonly choices: QuestionChoices,
    private readonly onClosed: (changed: boolean) => void,
  ) {
    super(app);
    let answer = "";
    if (question.answer !== null) answer = question.answer.text;
    this.edit = { answer, followUp: "" };
  }

  override onOpen(): void {
    const { contentEl } = this;
    if (this.question.answer === null) this.setTitle("Answer the question");
    else this.setTitle("Answered question");
    contentEl.addClass("dd-tokens", "dd-dialog");
    contentEl.createEl("p", { cls: "dd-question", text: this.question.text });
    contentEl.createEl("p", { cls: "dd-asked", text: `Asked in ${this.places.askedIn}` });
    new Setting(contentEl).setName("Answer").addTextArea((area) => {
      area.setPlaceholder("Lady Vess sent it, through [[Mira]]").setValue(this.edit.answer).onChange((value) => {
        this.edit.answer = value;
      });
      area.inputEl.setAttr("aria-label", "Answer");
      area.inputEl.addEventListener("keydown", (event) => {
        if (!isSubmit(event, true)) return;
        event.preventDefault();
        this.run(() => this.choices.save(this.edit));
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
        this.run(() => this.choices.save(this.edit));
      });
    });
    contentEl.createEl("p", { cls: "dd-where", text: `New lines go into ${this.places.writesTo}.` });
    const buttons = new Setting(contentEl);
    buttons.addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.run(() => this.choices.save(this.edit))));
    if (this.question.answer !== null) {
      buttons.addButton((button) => button.setButtonText("Reopen question").onClick(() => this.run(() => this.choices.reopen())));
    }
    buttons.addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
    buttons.addButton((button) => {
      button.setButtonText("Delete question").setWarning().onClick(() => this.confirmDelete(button));
      button.buttonEl.addClass("dd-delete");
    });
  }

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    if (this.confirmTimer !== null) window.clearTimeout(this.confirmTimer);
    this.contentEl.empty();
    this.onClosed(this.changed);
  }

  private confirmDelete(button: ButtonComponent): void {
    if (this.confirmTimer !== null) {
      this.run(() => this.choices.delete());
      return;
    }
    button.setButtonText("Press again to delete");
    this.confirmTimer = window.setTimeout(() => {
      this.confirmTimer = null;
      button.setButtonText("Delete question");
    }, CONFIRM_MS);
  }

  private run(change: () => Promise<boolean>): void {
    if (this.busy) return;
    this.busy = true;
    change()
      .then((wrote) => {
        this.busy = false;
        this.changed = wrote;
        this.close();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't change the question: ${messageOf(error)}`);
        if (!(error instanceof PartlyWritten)) return;
        this.changed = true;
        this.close();
      });
  }
}
