import type { PluginManifest } from "obsidian";
import type { PageId } from "../interface/campaign-pages";
import type { PluginSettings, SaveSettings } from "../settings/plugin-settings";
import type { NewsItem } from "../whats-new/news-item";
import { WhatsNew } from "../whats-new/whats-new";
import { FirstRun } from "./first-run";
import { sessionsWritten } from "./sessions-written";

export interface HelpVault {
  campaignFolders(): string[];
  filePaths(): string[];
}

export type OpenPage = (page: PageId) => Promise<void>;

export class Help {
  readonly whatsNew: WhatsNew;
  private readonly firstRun: FirstRun;

  constructor(
    settings: PluginSettings,
    manifest: Pick<PluginManifest, "version">,
    newsByVersion: ReadonlyMap<string, NewsItem>,
    save: SaveSettings,
    private readonly vault: HelpVault,
    private readonly openPage: OpenPage,
  ) {
    this.firstRun = new FirstRun(settings, manifest.version, save);
    this.whatsNew = new WhatsNew(settings, manifest.version, newsByVersion, save);
  }

  async start(): Promise<void> {
    const written = sessionsWritten(this.vault.campaignFolders(), this.vault.filePaths());
    await this.firstRun.begin(written, () => this.showWelcome());
  }

  async showWelcome(): Promise<void> {
    await this.openPage("welcome");
  }
}
