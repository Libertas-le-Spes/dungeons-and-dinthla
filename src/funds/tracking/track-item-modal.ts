import { ButtonComponent, Setting, type App } from "obsidian";
import { RecordChangeDialog } from "../../views/dialogs/record-change-dialog";

export const TRACK_TITLE = "Track on the funds page";
export const COULD_NOT_TRACK = "Couldn't track the item";

export interface TrackShown {
  readonly name: string;
  readonly holder: string;
  readonly writesTo: string;
}

export interface TrackSaving {
  save(): Promise<boolean>;
}

export class TrackItemModal extends RecordChangeDialog {
  constructor(
    app: App,
    private readonly shown: TrackShown,
    private readonly saving: TrackSaving,
    onClosed: (changed: boolean) => void,
  ) {
    super(app, onClosed);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle(TRACK_TITLE);
    contentEl.addClass("dd-tokens", "dd-dialog");
    contentEl.createEl("p", { cls: "dd-subject", text: this.shown.name });
    contentEl.createEl("p", { cls: "dd-reading", text: `Held by ${this.shown.holder}` });
    contentEl.createEl("p", { cls: "dd-where", text: `Adds a line to ${this.shown.writesTo}.` });
    const buttons = new Setting(contentEl);
    new ButtonComponent(buttons.controlEl).setButtonText("Save").setCta().onClick(this.saveTracking.bind(this));
    new ButtonComponent(buttons.controlEl).setButtonText("Cancel").onClick(this.close.bind(this));
  }

  private saveTracking(): void {
    this.runChange(this.saving.save.bind(this.saving), COULD_NOT_TRACK);
  }
}
