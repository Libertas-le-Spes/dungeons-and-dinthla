import { Notice, PluginSettingTab, Setting, type App, type EventRef, type Plugin, type TFile } from "obsidian";
import {
  backgroundOf,
  chooseBackground,
  chooseWash,
  isPicture,
  removeBackground,
  washOf,
  type Wash,
} from "../campaign/campaign-background";
import { mainNotePathOf, NO_CAMPAIGN } from "../campaign/campaign-folders";
import { messageOf } from "../views/message-of";
import { PictureSuggestModal } from "./picture-suggest-modal";

const FOLDER_HINT = "Its folder. Every note in it, and in the folders inside it, shows the background picture below.";
const NO_PICTURE = "None yet.";
const WASH_NAMES: Record<Wash, string> = { subtle: "Subtle", balanced: "Balanced", strong: "Strong" };

export interface CampaignChoice {
  folders(): string[];
  shown(): string | null;
  choose(folder: string): Promise<void>;
}

export class CampaignSettingTab extends PluginSettingTab {
  private watching: EventRef | null = null;

  constructor(
    app: App,
    plugin: Plugin,
    private readonly campaigns: CampaignChoice,
  ) {
    super(app, plugin);
  }

  override display(): void {
    this.stopWatching();
    this.containerEl.empty();
    const folder = this.campaigns.shown();
    if (folder === null) {
      this.containerEl.createEl("p", { text: NO_CAMPAIGN });
      return;
    }
    this.showCampaign(folder);
    const mainNote = this.app.vault.getFileByPath(mainNotePathOf(folder));
    if (mainNote === null) return;
    this.showBackground(folder, mainNote);
    this.watching = this.app.metadataCache.on("changed", (file) => {
      if (file.path === mainNote.path) this.display();
    });
  }

  override hide(): void {
    this.stopWatching();
    super.hide();
  }

  private stopWatching(): void {
    if (this.watching === null) return;
    this.app.metadataCache.offref(this.watching);
    this.watching = null;
  }

  private showCampaign(folder: string): void {
    new Setting(this.containerEl)
      .setName("Campaign")
      .setDesc(FOLDER_HINT)
      .addDropdown((dropdown) => {
        for (const each of this.campaigns.folders()) dropdown.addOption(each, each);
        dropdown.setValue(folder).onChange((chosen) =>
          this.save(async () => {
            await this.campaigns.choose(chosen);
            this.display();
          }),
        );
      });
  }

  private showBackground(folder: string, mainNote: TFile): void {
    const { fileManager, metadataCache } = this.app;
    const background = backgroundOf(folder, metadataCache);
    let description = NO_PICTURE;
    let chooseText = "Choose a picture";
    if (background.picture !== null) {
      description = background.picture.path;
      chooseText = "Change picture";
    }
    const choose = (picture: TFile) =>
      this.save(() => chooseBackground(fileManager, mainNote, metadataCache.fileToLinktext(picture, mainNote.path)));
    new Setting(this.containerEl)
      .setName("Background picture")
      .setDesc(description)
      .addButton((button) =>
        button.setButtonText(chooseText).onClick(() => new PictureSuggestModal(this.app, this.picturesInVault(), choose).open()),
      )
      .addButton((button) =>
        button
          .setButtonText("Remove picture")
          .setDisabled(background.picture === null)
          .onClick(() => this.save(() => removeBackground(fileManager, mainNote))),
      );
    new Setting(this.containerEl).setName("How much of the picture shows").addDropdown((dropdown) => {
      dropdown
        .addOptions(WASH_NAMES)
        .setValue(background.wash)
        .onChange((chosen) => this.save(() => chooseWash(fileManager, mainNote, washOf(chosen))));
    });
  }

  private picturesInVault(): TFile[] {
    return this.app.vault.getFiles().filter(isPicture);
  }

  private save(write: () => Promise<void>): void {
    write().catch((error: unknown) => new Notice(`Couldn't save the campaign: ${messageOf(error)}`));
  }
}
