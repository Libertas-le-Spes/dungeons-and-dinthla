import { refusalForCampaignsFolder } from "../fence/campaigns-folder-path";
import type { PluginSettings, SaveSettings } from "./plugin-settings";

export type CampaignsFolderMoved = () => Promise<void>;

export class CampaignsFolder {
  constructor(
    private readonly settings: PluginSettings,
    private readonly save: SaveSettings,
    private readonly moved: CampaignsFolderMoved,
  ) {}

  get path(): string | null {
    return this.settings.campaignsFolder;
  }

  async choose(path: string): Promise<void> {
    const refusal = refusalForCampaignsFolder(path);
    if (refusal !== null) throw new Error(refusal);
    if (path === this.settings.campaignsFolder) return;
    this.settings.campaignsFolder = path;
    await this.save(this.settings);
    await this.moved();
  }
}
