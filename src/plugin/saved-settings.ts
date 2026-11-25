import type { DeviceStorage } from "../host/keeping/device-storage";
import type { PluginData } from "../host/keeping/plugin-data";
import type { Telling } from "../host/showing/telling";
import { messageOf } from "../views/dialogs/message-of";
import type { KeptDrafts } from "../session-notes/kept/kept-drafts";
import type { LocalDrafts } from "../settings/drafts/local-drafts";
import { OldDrafts } from "../settings/drafts/old-drafts";
import { CampaignsFolderSetting, type CampaignsFolderChanged } from "../settings/saved/campaigns-folder-setting";
import { ChosenCampaign, type OpenCampaign } from "../settings/saved/chosen-campaign";
import { settingsOf, type PluginSettings } from "../settings/saved/plugin-settings";
import { SettingsSaver } from "../settings/saved/settings-saver";

export interface SettingsHost {
  readonly data: PluginData;
  readonly device: DeviceStorage;
  readonly settingsFolder: string;
  readonly telling: Pick<Telling, "say">;
}

export class SavedSettings {
  private oldDrafts: OldDrafts;
  private currentSaver: SettingsSaver;
  private currentChosen: ChosenCampaign;
  private currentCampaignsFolder: CampaignsFolderSetting;
  private tidying = false;

  constructor(
    private readonly host: SettingsHost,
    private readonly campaign: OpenCampaign,
    private readonly campaignsFolderChanged: CampaignsFolderChanged,
  ) {
    this.oldDrafts = new OldDrafts(null, host.device);
    this.currentSaver = this.saverOf(settingsOf(null, host.settingsFolder));
    this.currentChosen = new ChosenCampaign(this.currentSaver, campaign);
    this.currentCampaignsFolder = this.campaignsFolderOf(this.currentSaver);
  }

  get saver(): SettingsSaver {
    return this.currentSaver;
  }

  get chosen(): ChosenCampaign {
    return this.currentChosen;
  }

  get campaignsFolder(): CampaignsFolderSetting {
    return this.currentCampaignsFolder;
  }

  async load(): Promise<void> {
    const saved = await this.host.data.load();
    this.oldDrafts = new OldDrafts(saved, this.host.device);
    this.currentSaver = this.saverOf(settingsOf(saved, this.host.settingsFolder));
    this.currentChosen = new ChosenCampaign(this.currentSaver, this.campaign);
    this.currentCampaignsFolder = this.campaignsFolderOf(this.currentSaver);
  }

  moveOldDrafts(keptDrafts: KeptDrafts, local: LocalDrafts): void {
    if (this.oldDrafts.waiting) {
      keptDrafts.keepMoved(this.oldDrafts.texts);
      local.flush();
    }
    this.dropOldDrafts();
  }

  oldDraftsKept(): void {
    this.oldDrafts.keptOnDevice();
    this.dropOldDrafts();
  }

  private dropOldDrafts(): void {
    if (!this.oldDrafts.leftInFile || this.tidying) return;
    this.tidying = true;
    this.currentSaver
      .save({})
      .then(this.fileRewritten.bind(this))
      .catch(this.notTidied.bind(this));
  }

  private fileRewritten(): void {
    this.tidying = false;
    this.oldDrafts.fileRewritten();
  }

  private notTidied(error: unknown): void {
    this.tidying = false;
    this.host.telling.say(`Couldn't tidy the plugin's settings file: ${messageOf(error)}`);
  }

  private async write(settings: PluginSettings): Promise<void> {
    await this.host.data.save(this.oldDrafts.dataOf(settings));
  }

  private saverOf(settings: PluginSettings): SettingsSaver {
    return new SettingsSaver(settings, this.write.bind(this));
  }

  private campaignsFolderOf(saver: SettingsSaver): CampaignsFolderSetting {
    return new CampaignsFolderSetting(saver, this.campaignsFolderChanged, this.host.settingsFolder, this.host.telling);
  }
}
