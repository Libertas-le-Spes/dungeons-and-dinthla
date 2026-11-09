import type { PluginSettings } from "./plugin-settings";

export type WriteSettings = (settings: PluginSettings) => Promise<void>;

export type SettingsChange = Partial<PluginSettings>;

export class SettingsSaver {
  private running: Promise<void> = Promise.resolve();

  constructor(
    private readonly current: PluginSettings,
    private readonly write: WriteSettings,
  ) {}

  get settings(): Readonly<PluginSettings> {
    return this.current;
  }

  save(change: SettingsChange): Promise<void> {
    const saving = this.running.then(() => this.writeThenApply(change));
    this.running = saving.catch(() => undefined);
    return saving;
  }

  private async writeThenApply(change: SettingsChange): Promise<void> {
    await this.write({ ...this.current, ...change });
    Object.assign(this.current, change);
  }
}
