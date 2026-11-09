import type { SettingsSaver } from "./settings-saver";

export class ChosenCampaign {
  constructor(
    private readonly saver: SettingsSaver,
    private readonly open: (folder: string) => Promise<void>,
  ) {}

  get folder(): string | null {
    return this.saver.settings.campaignFolder;
  }

  async choose(folder: string): Promise<void> {
    if (folder !== this.saver.settings.campaignFolder) await this.saver.save({ campaignFolder: folder });
    await this.open(folder);
  }

  async renamed(path: string, oldPath: string): Promise<void> {
    if (oldPath !== this.saver.settings.campaignFolder) return;
    await this.saver.save({ campaignFolder: path });
  }
}
