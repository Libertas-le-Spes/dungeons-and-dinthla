import type { PluginSettings, SaveSettings } from "./plugin-settings";

export class ChosenCampaign {
  constructor(
    private readonly settings: PluginSettings,
    private readonly save: SaveSettings,
    private readonly open: (folder: string) => Promise<void>,
  ) {}

  get folder(): string | null {
    return this.settings.campaignFolder;
  }

  async choose(folder: string): Promise<void> {
    if (folder !== this.settings.campaignFolder) await this.keep(folder);
    await this.open(folder);
  }

  async renamed(path: string, oldPath: string): Promise<void> {
    if (oldPath !== this.settings.campaignFolder) return;
    await this.keep(path);
  }

  private async keep(folder: string): Promise<void> {
    await this.save({ ...this.settings, campaignFolder: folder });
    this.settings.campaignFolder = folder;
  }
}
