import type { PluginSettings } from "./plugin-settings";
import type { SettingsChange, SettingsSaver } from "./settings-saver";

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
    private readonly open: (folder: string) => Promise<void>,
  ) {}

  get folder(): string | null {
    return this.saver.settings.campaignFolder;
  }

  async choose(folder: string): Promise<void> {
    this.choices += 1;
    const choice = this.choices;
    await this.saver.saveFrom((settings) => changeTo(folder, settings));
    if (choice !== this.choices) return;
    await this.open(folder);
  }

  async renamed(path: string, oldPath: string): Promise<void> {
    await this.saver.saveFrom((settings) => renameOf(path, oldPath, settings));
  }
}
