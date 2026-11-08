import type { PluginSettings } from "./plugin-settings";

export class ChosenCampaign {
  constructor(
    private readonly settings: PluginSettings,
    private readonly save: (settings: PluginSettings) => Promise<void>,
    private readonly open: (folder: string) => Promise<void>,
  ) {}

  get folder(): string | null {
    return this.settings.campaignFolder;
  }

  async choose(folder: string): Promise<void> {
    if (folder !== this.settings.campaignFolder) {
      this.settings.campaignFolder = folder;
      await this.save(this.settings);
    }
    await this.open(folder);
  }

  async renamed(path: string, oldPath: string): Promise<void> {
    if (oldPath !== this.settings.campaignFolder) return;
    this.settings.campaignFolder = path;
    await this.save(this.settings);
  }
}
