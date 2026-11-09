import type { PluginSettings, SaveSettings } from "../settings/plugin-settings";
import type { News, NewsItem } from "./news-item";

export class WhatsNew implements News {
  constructor(
    private readonly settings: PluginSettings,
    private readonly version: string,
    private readonly newsByVersion: ReadonlyMap<string, NewsItem>,
    private readonly save: SaveSettings,
  ) {}

  latest(): NewsItem | null {
    if (this.settings.lastVersionSeen === this.version) return null;
    const item = this.newsByVersion.get(this.version);
    if (item === undefined) return null;
    return item;
  }

  async seen(): Promise<void> {
    this.settings.lastVersionSeen = this.version;
    await this.save(this.settings);
  }
}
