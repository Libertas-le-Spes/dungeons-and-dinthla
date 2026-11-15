import { Modal, Notice, Setting, type App } from "obsidian";
import { messageOf } from "../../views/dialogs/message-of";

export const NEW_CAMPAIGN_TITLE = "New campaign";
export const NEW_CAMPAIGN_NAME = "Campaign name";
export const NEW_CAMPAIGN_HOW =
  "Name it and the campaign's folder is made inside your Campaigns folder, with its main note. It opens when it is made.";
export const MAKE_THE_CAMPAIGN = "Make campaign";

export interface NewCampaignAnswers {
  make(name: string): Promise<boolean>;
  made(): void;
}

interface Disableable {
  setDisabled(disabled: boolean): unknown;
}

const NOT_OPEN: Disableable = {
  setDisabled(): void {},
};

export class NewCampaignModal extends Modal {
  private name = "";
  private making = false;
  private makeButton: Disableable = NOT_OPEN;

  constructor(
    app: App,
    private readonly answers: NewCampaignAnswers,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle(NEW_CAMPAIGN_TITLE);
    this.contentEl.addClass("dd-tokens", "dd-new-campaign");
    this.contentEl.createEl("p", { text: NEW_CAMPAIGN_HOW });
    new Setting(this.contentEl).setName(NEW_CAMPAIGN_NAME).addText((text) => {
      text.onChange((value) => {
        this.name = value;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        this.makeTyped();
      });
      text.inputEl.focus();
    });
    new Setting(this.contentEl)
      .addButton((button) => {
        this.makeButton = button;
        button.setButtonText(MAKE_THE_CAMPAIGN).setCta().onClick(() => this.makeTyped());
      })
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private makeTyped(): void {
    if (this.making) return;
    this.makeAndOpen(this.name).catch((error: unknown) => new Notice(`Couldn't make the campaign: ${messageOf(error)}`));
  }

  private async makeAndOpen(name: string): Promise<void> {
    this.making = true;
    this.makeButton.setDisabled(true);
    try {
      if (!(await this.answers.make(name))) return;
    } finally {
      this.making = false;
      this.makeButton.setDisabled(false);
    }
    this.close();
    this.answers.made();
  }
}
