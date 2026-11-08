import { Modal, Notice, Setting, type App, type ButtonComponent } from "obsidian";
import type { QuestionRecord } from "../campaign/campaign";
import type { QuestionEdit } from "./question-writer";

export interface QuestionChoices {
  save(edit: QuestionEdit): Promise<void>;
  reopen(): Promise<void>;
  delete(): Promise<void>;
}

const CONFIRM_MS = 4000;

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export class QuestionModal extends Modal {
  private readonly edit: QuestionEdit;
  private confirmTimer: number | null = null;

  constructor(
    app: App,
    private readonly question: QuestionRecord,
    private readonly sessionLabel: string,
    private readonly choices: QuestionChoices,
    private readonly onClosed: () => void,
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
    contentEl.addClass("dd-tokens", "dd-question-dialog");
    contentEl.createEl("p", { cls: "dd-question", text: this.question.text });
    new Setting(contentEl).setName("Answer").addTextArea((area) => {
      area.setPlaceholder("Lady Vess sent it, through [[Mira]]").setValue(this.edit.answer).onChange((value) => {
        this.edit.answer = value;
      });
      area.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        this.run(this.choices.save(this.edit));
      });
      area.inputEl.focus();
    });
    new Setting(contentEl).setName("Follow-up question (optional)").addText((text) => {
      text.setPlaceholder("Why would she hide it?").onChange((value) => {
        this.edit.followUp = value;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        this.run(this.choices.save(this.edit));
      });
    });
    contentEl.createEl("p", { cls: "dd-where", text: `New lines go into ${this.sessionLabel}.` });
    const buttons = new Setting(contentEl);
    buttons.addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.run(this.choices.save(this.edit))));
    if (this.question.answer !== null) {
      buttons.addButton((button) => button.setButtonText("Reopen question").onClick(() => this.run(this.choices.reopen())));
    }
    buttons.addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
    buttons.addButton((button) => {
      button.setButtonText("Delete question").setWarning().onClick(() => this.confirmDelete(button));
    });
  }

  override onClose(): void {
    if (this.confirmTimer !== null) window.clearTimeout(this.confirmTimer);
    this.contentEl.empty();
    this.onClosed();
  }

  private confirmDelete(button: ButtonComponent): void {
    if (this.confirmTimer !== null) {
      this.run(this.choices.delete());
      return;
    }
    button.setButtonText("Press again to delete");
    this.confirmTimer = window.setTimeout(() => {
      this.confirmTimer = null;
      button.setButtonText("Delete question");
    }, CONFIRM_MS);
  }

  private run(change: Promise<void>): void {
    this.close();
    change.catch((error: unknown) => new Notice(`Couldn't change the question: ${messageOf(error)}`));
  }
}
