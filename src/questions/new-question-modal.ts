import { Modal, Notice, Setting, type App } from "obsidian";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";

export interface NewQuestion {
  question: string;
  answer: string;
}

export class NewQuestionModal extends Modal {
  private readonly entry: NewQuestion = { question: "", answer: "" };
  private questionInput: HTMLInputElement | null = null;
  private busy = false;

  constructor(
    app: App,
    private readonly writesTo: string,
    private readonly add: (entry: NewQuestion) => Promise<boolean>,
    private readonly onClosed: () => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle("New question");
    contentEl.addClass("dd-tokens", "dd-question-dialog");
    new Setting(contentEl).setName("Question").addText((text) => {
      text.setPlaceholder("Who sent the letter [[Brother Aldric]] carried").onChange((value) => {
        this.entry.question = value;
      });
      text.inputEl.setAttr("aria-label", "Question");
      text.inputEl.addEventListener("keydown", (event) => {
        if (!isSubmit(event, false)) return;
        event.preventDefault();
        this.save();
      });
      this.questionInput = text.inputEl;
      text.inputEl.focus();
    });
    new Setting(contentEl).setName("Answer (optional)").addTextArea((area) => {
      area.setPlaceholder("Lady Vess sent it, through [[Mira]]").onChange((value) => {
        this.entry.answer = value;
      });
      area.inputEl.setAttr("aria-label", "Answer");
      area.inputEl.addEventListener("keydown", (event) => {
        if (!isSubmit(event, true)) return;
        event.preventDefault();
        this.save();
      });
    });
    contentEl.createEl("p", { cls: "dd-where", text: `Adds a line to ${this.writesTo}.` });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.save()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
  }

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    this.contentEl.empty();
    this.onClosed();
  }

  private save(): void {
    if (this.busy) return;
    this.busy = true;
    this.add(this.entry)
      .then((added) => {
        this.busy = false;
        if (added) this.close();
        else if (this.questionInput !== null) this.questionInput.focus();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't add the question: ${messageOf(error)}`);
      });
  }
}
