import type { SettingsSaver } from "../settings/saved/settings-saver";

export type ShowWelcome = () => Promise<void>;

export class FirstRun {
  constructor(
    private readonly saver: SettingsSaver,
    private readonly version: string,
  ) {}

  async begin(sessionsWritten: boolean, showWelcome: ShowWelcome): Promise<void> {
    if (this.saver.settings.welcomeSeen) {
      await this.askForCampaignsFolder(showWelcome);
      return;
    }
    if (sessionsWritten) {
      await this.saver.save({ welcomeSeen: true });
      return;
    }
    await this.saver.save({ welcomeSeen: true, lastVersionSeen: this.version });
    await showWelcome();
  }

  private async askForCampaignsFolder(showWelcome: ShowWelcome): Promise<void> {
    if (this.saver.settings.campaignsFolder !== null) return;
    await showWelcome();
  }
}
