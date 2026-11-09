import { Notice } from "obsidian";
import { isInConfigFolder, NOT_THE_CONFIG_FOLDER, refusalForCampaignsFolder } from "../fence/campaigns-folder-path";
import { messageOf } from "../views/message-of";
import type { PluginSettings } from "./plugin-settings";
import type { SettingsChange, SettingsSaver } from "./settings-saver";

export type CampaignsFolderChanged = () => Promise<void>;

function changeTo(path: string, settings: Readonly<PluginSettings>): SettingsChange | null {
  if (path === settings.campaignsFolder) return null;
  return { campaignsFolder: path };
}

export class CampaignsFolderSetting {
  private choices = 0;
  private changedSinceLook = false;

  constructor(
    private readonly saver: SettingsSaver,
    private readonly changed: CampaignsFolderChanged,
    private readonly configDir: string,
  ) {}

  get path(): string | null {
    return this.saver.settings.campaignsFolder;
  }

  async choose(path: string): Promise<void> {
    const refusal = refusalForCampaignsFolder(path);
    if (refusal !== null) throw new Error(refusal);
    if (isInConfigFolder(path, this.configDir)) throw new Error(NOT_THE_CONFIG_FOLDER);
    this.choices += 1;
    const choice = this.choices;
    const wrote = await this.saver.saveFrom((settings) => changeTo(path, settings));
    if (wrote) this.changedSinceLook = true;
    if (choice !== this.choices || !this.changedSinceLook) return;
    this.changedSinceLook = false;
    await this.lookAgain(path);
  }

  private async lookAgain(path: string): Promise<void> {
    try {
      await this.changed();
    } catch (error) {
      new Notice(`Set the Campaigns folder to ${path}, but couldn't open a campaign in it: ${messageOf(error)}`);
    }
  }
}
