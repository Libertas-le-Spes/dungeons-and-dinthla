import type { PluginSettings } from "./plugin-settings";

export type WriteSettings = (settings: PluginSettings) => Promise<void>;

export type SettingsChange = Partial<PluginSettings>;

export type ChangeFrom = (settings: Readonly<PluginSettings>) => SettingsChange | null;

export class SettingsSaver {
  private running: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly current: PluginSettings,
    private readonly write: WriteSettings,
  ) {}

  get settings(): Readonly<PluginSettings> {
    return this.current;
  }

  async save(change: SettingsChange): Promise<void> {
    await this.saveFrom(() => change);
  }

  saveFrom(changeFrom: ChangeFrom): Promise<boolean> {
    const saving = this.running.then(() => this.writeThenApply(changeFrom(this.current)));
    this.running = saving.catch(() => undefined);
    return saving;
  }

  async whenSaved(): Promise<void> {
    await this.running;
  }

  private async writeThenApply(change: SettingsChange | null): Promise<boolean> {
    if (change === null) return false;
    await this.write({ ...this.current, ...change });
    Object.assign(this.current, change);
    return true;
  }
}
