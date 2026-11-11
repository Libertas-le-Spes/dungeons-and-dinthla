import type { CampaignStore } from "../../campaign/campaign-store";
import type { PluginSettings } from "./plugin-settings";
import type { SettingsChange, SettingsSaver } from "./settings-saver";

export type OpenCampaign = Pick<CampaignStore, "open" | "campaignFolder">;

function changeTo(folder: string, settings: Readonly<PluginSettings>): SettingsChange | null {
  if (folder === settings.campaignFolder) return null;
  return { campaignFolder: folder };
}

function renameOf(path: string, oldPath: string, settings: Readonly<PluginSettings>): SettingsChange | null {
  if (oldPath !== settings.campaignFolder) return null;
  return { campaignFolder: path };
}

export class ChosenCampaign {
  private choices = 0;

  constructor(
    private readonly saver: SettingsSaver,
    private readonly campaign: OpenCampaign,
  ) {}

  get folder(): string | null {
    return this.saver.settings.campaignFolder;
  }

  async choose(folder: string): Promise<void> {
    this.choices += 1;
    const choice = this.choices;
    try {
      await this.saver.saveFrom((settings) => changeTo(folder, settings));
    } catch (error) {
      if (choice === this.choices) await this.openSavedIfNotOpen();
      throw error;
    }
    await this.saver.whenSaved();
    if (choice !== this.choices) return;
    await this.openSaved();
  }

  async renamed(path: string, oldPath: string): Promise<void> {
    await this.saver.saveFrom((settings) => renameOf(path, oldPath, settings));
  }

  private async openSaved(): Promise<void> {
    const saved = this.folder;
    if (saved === null) return;
    await this.campaign.open(saved);
  }

  private async openSavedIfNotOpen(): Promise<void> {
    if (this.folder === this.campaign.campaignFolder) return;
    await this.openSaved();
  }
}
