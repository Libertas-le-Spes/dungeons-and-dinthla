import type { SettingsSaver } from "../settings/settings-saver";
import type { News, NewsItem } from "./news-item";

export class WhatsNew implements News {
  constructor(
    private readonly saver: SettingsSaver,
    private readonly version: string,
    private readonly newsByVersion: ReadonlyMap<string, NewsItem>,
  ) {}

  latest(): NewsItem | null {
    if (this.saver.settings.lastVersionSeen === this.version) return null;
    const item = this.newsByVersion.get(this.version);
    if (item === undefined) return null;
    return item;
  }

  async seen(): Promise<void> {
    await this.saver.save({ lastVersionSeen: this.version });
  }
}
