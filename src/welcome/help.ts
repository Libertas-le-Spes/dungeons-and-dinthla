import type { PluginManifest } from "obsidian";
import type { SettingsSaver } from "../settings/saved/settings-saver";
import type { NewsItem } from "../whats-new/news-item";
import { WhatsNew } from "../whats-new/whats-new";
import { FirstRun, type ShowWelcome } from "./first-run";
import { sessionsWritten } from "./sessions-written";

export interface HelpFiles {
  campaignFolders(): string[];
  filePaths(): string[];
}

export class Help {
  readonly whatsNew: WhatsNew;
  private readonly firstRun: FirstRun;

  constructor(
    saver: SettingsSaver,
    manifest: Pick<PluginManifest, "version">,
    newsByVersion: ReadonlyMap<string, NewsItem>,
    private readonly files: HelpFiles,
    private readonly openWelcome: ShowWelcome,
  ) {
    this.firstRun = new FirstRun(saver, manifest.version);
    this.whatsNew = new WhatsNew(saver, manifest.version, newsByVersion);
  }

  async start(): Promise<void> {
    const written = sessionsWritten(this.files.campaignFolders(), this.files.filePaths());
    await this.firstRun.begin(written, () => this.showWelcome());
  }

  async showWelcome(): Promise<void> {
    await this.openWelcome();
  }
}
