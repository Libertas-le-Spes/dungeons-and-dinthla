import { Setting, type App } from "obsidian";
import { isSubmit } from "../views/dialogs/keys";
import { ChangeDialog } from "../views/dialogs/change-dialog";

export interface NewQuestion {
  question: string;
  answer: string;
}

export class NewQuestionModal extends ChangeDialog {
  private readonly entry: NewQuestion = { question: "", answer: "" };
  private questionInput: HTMLInputElement | null = null;

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
    contentEl.addClass("dd-tokens", "dd-dialog");
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
    contentEl.createEl("p", { cls: "dd-where", text: `New lines go into ${this.writesTo}.` });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.save()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
  }

  protected override closed(): void {
    this.onClosed();
  }

  protected override finished(wrote: boolean): void {
    if (wrote) this.close();
    else if (this.questionInput !== null) this.questionInput.focus();
  }

  protected override failed(): void {}

  private save(): void {
    this.runChange(() => this.add(this.entry), "Couldn't add the question");
  }
}
