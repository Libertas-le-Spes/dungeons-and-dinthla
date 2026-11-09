export const LEFT_CAMPAIGN =
  "This note was moved out of the campaign, so it opens in Obsidian's editor from now on. Save what you typed here first.";
export const OPEN_IN_EDITOR = "Open in Obsidian's editor";

export class LeftCampaign {
  private readonly button: HTMLButtonElement;

  constructor(parent: HTMLElement, open: () => void) {
    const notice = parent.createDiv({ cls: "dd-left-campaign" });
    notice.createEl("p", { cls: "dd-left-campaign-message", text: LEFT_CAMPAIGN });
    this.button = notice.createEl("button", { cls: "mod-cta dd-open-in-editor", text: OPEN_IN_EDITOR });
    this.button.addEventListener("click", open);
    this.setUnsaved(true);
  }

  setUnsaved(unsaved: boolean): void {
    this.button.disabled = unsaved;
  }
}
