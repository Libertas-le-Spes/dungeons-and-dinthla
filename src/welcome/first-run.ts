import type { PluginSettings, SaveSettings } from "../settings/plugin-settings";

export type ShowWelcome = () => Promise<void>;

export class FirstRun {
  constructor(
    private readonly settings: PluginSettings,
    private readonly version: string,
    private readonly save: SaveSettings,
  ) {}

  async begin(sessionsWritten: boolean, showWelcome: ShowWelcome): Promise<void> {
    if (this.settings.welcomeSeen) {
      await this.askForCampaignsFolder(showWelcome);
      return;
    }
    this.settings.welcomeSeen = true;
    if (sessionsWritten) {
      await this.save(this.settings);
      return;
    }
    this.settings.lastVersionSeen = this.version;
    await this.save(this.settings);
    await showWelcome();
  }

  private async askForCampaignsFolder(showWelcome: ShowWelcome): Promise<void> {
    if (this.settings.campaignsFolder !== null) return;
    await showWelcome();
  }
}
