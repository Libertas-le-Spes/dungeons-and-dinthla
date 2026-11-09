import type { PluginSettings } from "./plugin-settings";

export const DRAFT_PAUSE_MS = 500;

export interface Timer {
  start(run: () => void, ms: number): number;
  stop(id: number): void;
}

export class DraftFile {
  private waiting: number | null = null;

  constructor(
    private readonly settings: PluginSettings,
    private readonly save: (settings: PluginSettings) => Promise<void>,
    private readonly timer: Timer,
    private readonly failed: (error: unknown) => void,
  ) {}

  changed(drafts: Record<string, string>): void {
    this.settings.drafts = drafts;
    this.stopWaiting();
    this.waiting = this.timer.start(() => this.write(), DRAFT_PAUSE_MS);
  }

  flush(): void {
    if (this.waiting === null) return;
    this.stopWaiting();
    this.write();
  }

  private stopWaiting(): void {
    if (this.waiting === null) return;
    this.timer.stop(this.waiting);
    this.waiting = null;
  }

  private write(): void {
    this.waiting = null;
    this.save(this.settings).catch(this.failed);
  }
}
