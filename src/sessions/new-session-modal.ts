import { Modal, Setting, type App } from "obsidian";
import type { NewSession } from "./create-session";
import { playedDateOf, withPlayedDate } from "./played-date";

const CARRY_OVER = "Open questions, active quests, the purse and every character carry over. The new session starts with an empty page of notes.";

export class NewSessionModal extends Modal {
  private readonly session: NewSession = { title: "", played: playedDateOf(new Date()) };
  private started: Promise<void> = Promise.resolve();

  constructor(
    app: App,
    private readonly number: number,
    private readonly start: (session: NewSession) => Promise<void>,
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle(`Start session ${this.number}`);
    contentEl.addClass("dd-tokens", "dd-new-session");
    new Setting(contentEl).setName("Title (optional)").addText((text) => {
      text.setPlaceholder("The Old Mill").onChange((value) => {
        this.session.title = value;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        this.submit();
      });
      text.inputEl.focus();
    });
    new Setting(contentEl).setName("Played on").addText((text) => {
      text.inputEl.type = "date";
      text.setValue(this.session.played).onChange((value) => {
        this.session.played = value;
      });
    });
    contentEl.createEl("p", { cls: "dd-carry", text: CARRY_OVER });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Start session").setCta().onClick(() => this.submit()))
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  startSettled(): Promise<void> {
    return this.started;
  }

  private submit(): void {
    this.close();
    this.started = this.start(withPlayedDate(this.session, new Date()));
  }
}
