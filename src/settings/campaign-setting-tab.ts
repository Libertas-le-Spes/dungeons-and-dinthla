import { ButtonComponent, DropdownComponent, Notice, PluginSettingTab, Setting, type App, type Plugin, type TFile } from "obsidian";
import { backgroundOf, chooseWash, choosePicture, isPicture, removePicture, washOf, type Wash } from "../campaign/campaign-background";
import { mainNotePathOf, NO_CAMPAIGN } from "../campaign/campaign-folders";
import { messageOf } from "../views/message-of";
import { PictureSuggestModal } from "./picture-suggest-modal";

const FOLDER_HINT = "Its folder. Every note in it, and in the folders inside it, shows the background picture below.";
const NO_PICTURE = "None yet.";
const WELCOME_HINT = "The first steps for a new campaign. They open in the campaign tab, behind this window.";
const WASH_NAMES: Record<Wash, string> = { subtle: "Subtle", balanced: "Balanced", strong: "Strong" };

export interface CampaignChoice {
  folders(): string[];
  chosen(): string | null;
  choose(folder: string): Promise<void>;
}

interface PictureRows {
  folder: string;
  picture: Setting;
  choose: ButtonComponent;
  remove: ButtonComponent;
  wash: DropdownComponent;
}

export class CampaignSettingTab extends PluginSettingTab {
  private rows: PictureRows | null = null;

  constructor(
    app: App,
    plugin: Plugin,
    private readonly campaigns: CampaignChoice,
    private readonly showWelcome: () => Promise<void>,
  ) {
    super(app, plugin);
    plugin.registerEvent(app.metadataCache.on("changed", (file) => this.noteChanged(file.path)));
  }

  override display(): void {
    this.rows = null;
    this.containerEl.empty();
    this.showCampaign();
    this.addWelcomeRow();
  }

  private showCampaign(): void {
    const folder = this.campaigns.chosen();
    if (folder === null) {
      this.containerEl.createEl("p", { text: NO_CAMPAIGN });
      return;
    }
    const campaign = new Setting(this.containerEl).setName("Campaign").setDesc(FOLDER_HINT);
    const rows = this.addPictureRows(folder);
    const dropdown = new DropdownComponent(campaign.controlEl);
    for (const each of this.campaigns.folders()) dropdown.addOption(each, each);
    dropdown.setValue(folder).onChange((chosen) =>
      this.save(async () => {
        await this.campaigns.choose(chosen);
        rows.folder = chosen;
        this.showPictureSettings(rows);
      }),
    );
    this.rows = rows;
    this.showPictureSettings(rows);
  }

  private addWelcomeRow(): void {
    const welcome = new Setting(this.containerEl).setName("Welcome page").setDesc(WELCOME_HINT);
    new ButtonComponent(welcome.controlEl).setButtonText("Show this again").onClick(() => this.openWelcome());
  }

  private openWelcome(): void {
    this.showWelcome().catch((error: unknown) => new Notice(`Couldn't open the welcome page: ${messageOf(error)}`));
  }

  override hide(): void {
    this.rows = null;
    super.hide();
  }

  private noteChanged(path: string): void {
    if (this.rows === null || path !== mainNotePathOf(this.rows.folder)) return;
    this.showPictureSettings(this.rows);
  }

  private addPictureRows(folder: string): PictureRows {
    const picture = new Setting(this.containerEl).setName("Background picture");
    const choose = new ButtonComponent(picture.controlEl);
    const remove = new ButtonComponent(picture.controlEl).setButtonText("Remove picture");
    const washSetting = new Setting(this.containerEl).setName("How much of the picture shows");
    const wash = new DropdownComponent(washSetting.controlEl).addOptions(WASH_NAMES);
    const rows: PictureRows = { folder, picture, choose, remove, wash };
    choose.onClick(() => new PictureSuggestModal(this.app, this.picturesInVault(), (chosen) => this.choosePictureFor(rows, chosen)).open());
    remove.onClick(() => this.writeMainNote(rows, (mainNote) => removePicture(this.app.fileManager, mainNote)));
    wash.onChange((chosen) => this.writeMainNote(rows, (mainNote) => chooseWash(this.app.fileManager, mainNote, washOf(chosen))));
    return rows;
  }

  private showPictureSettings(rows: PictureRows): void {
    const background = backgroundOf(rows.folder, this.app.metadataCache);
    let description = NO_PICTURE;
    let chooseText = "Choose a picture";
    if (background.picture !== null) {
      description = background.picture.path;
      chooseText = "Change picture";
    }
    rows.picture.setDesc(description);
    rows.choose.setButtonText(chooseText);
    rows.remove.setDisabled(background.picture === null);
    rows.wash.setValue(background.wash);
  }

  private choosePictureFor(rows: PictureRows, picture: TFile): void {
    this.writeMainNote(rows, (mainNote) =>
      choosePicture(this.app.fileManager, mainNote, this.app.metadataCache.fileToLinktext(picture, mainNote.path)),
    );
  }

  private writeMainNote(rows: PictureRows, write: (mainNote: TFile) => Promise<void>): void {
    const mainNote = this.app.vault.getFileByPath(mainNotePathOf(rows.folder));
    if (mainNote === null) {
      new Notice(`Couldn't save the campaign: ${mainNotePathOf(rows.folder)} is missing.`);
      return;
    }
    this.save(() => write(mainNote));
  }

  private picturesInVault(): TFile[] {
    return this.app.vault.getFiles().filter(isPicture);
  }

  private save(write: () => Promise<void>): void {
    write().catch((error: unknown) => new Notice(`Couldn't save the campaign: ${messageOf(error)}`));
  }
}
