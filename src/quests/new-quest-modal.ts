import { Modal, Notice, Setting, type App } from "obsidian";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";
import { CharacterSuggest } from "./character-suggest";
import type { NewQuest } from "./new-quest";

export class NewQuestModal extends Modal {
  private readonly entry: NewQuest = { title: "", givenBy: "", reward: "" };
  private titleInput: HTMLInputElement | null = null;
  private busy = false;

  constructor(
    app: App,
    private readonly writesTo: string,
    private readonly characters: string[],
    private readonly add: (entry: NewQuest) => Promise<boolean>,
    private readonly onClosed: () => void,
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle("New quest");
    contentEl.addClass("dd-tokens", "dd-dialog");
    new Setting(contentEl).setName("Quest").addText((text) => {
      text.setPlaceholder("Find the missing caravan").onChange((value) => {
        this.entry.title = value;
      });
      this.submitOnEnter(text.inputEl, "Quest");
      this.titleInput = text.inputEl;
      text.inputEl.focus();
    });
    new Setting(contentEl).setName("Given by (optional)").addText((text) => {
      text.setPlaceholder("Lady Vess").onChange((value) => {
        this.entry.givenBy = value;
      });
      this.submitOnEnter(text.inputEl, "Given by");
      new CharacterSuggest(this.app, text.inputEl, this.characters);
    });
    new Setting(contentEl).setName("Reward (optional)").addText((text) => {
      text.setPlaceholder("200 gp").onChange((value) => {
        this.entry.reward = value;
      });
      this.submitOnEnter(text.inputEl, "Reward");
    });
    contentEl.createEl("p", { cls: "dd-where", text: `New lines go into ${this.writesTo}.` });
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

  private submitOnEnter(input: HTMLInputElement, label: string): void {
    input.setAttr("aria-label", label);
    input.addEventListener("keydown", (event) => {
      if (!isSubmit(event, false)) return;
      event.preventDefault();
      this.save();
    });
  }

  private save(): void {
    if (this.busy) return;
    this.busy = true;
    this.add(this.entry)
      .then((added) => {
        this.busy = false;
        if (added) this.close();
        else if (this.titleInput !== null) this.titleInput.focus();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't add the quest: ${messageOf(error)}`);
      });
  }
}
