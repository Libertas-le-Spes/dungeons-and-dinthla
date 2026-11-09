import { refusalForCampaignsFolder } from "../fence/campaigns-folder-path";
import type { SettingsSaver } from "./settings-saver";

export type CampaignsFolderMoved = () => Promise<void>;

export class CampaignsFolderSetting {
  constructor(
    private readonly saver: SettingsSaver,
    private readonly moved: CampaignsFolderMoved,
  ) {}

  get path(): string | null {
    return this.saver.settings.campaignsFolder;
  }

  async choose(path: string): Promise<void> {
    const refusal = refusalForCampaignsFolder(path);
    if (refusal !== null) throw new Error(refusal);
    if (path === this.saver.settings.campaignsFolder) return;
    await this.saver.save({ campaignsFolder: path });
    await this.moved();
  }
}
