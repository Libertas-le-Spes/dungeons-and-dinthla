import { draftsIn, type DraftRecord } from "./draft-record";

export const DRAFTS_KEY = "dungeons-and-dinthla-drafts";
export const DRAFT_PAUSE_MS = 500;
export const NOT_KEPT = "this device's storage didn't keep them";

export interface LocalStorage {
  load(key: string): unknown;
  save(key: string, value: unknown): void;
}

export interface Timer {
  start(run: () => void, ms: number): number;
  stop(id: number): void;
}

export interface LocalDraftsEvents {
  written(): void;
  failed(error: unknown): void;
}

export class LocalDrafts {
  private waiting: number | null = null;
  private pending: DraftRecord = {};
  private unwritten = false;
  private failing = false;

  constructor(
    private readonly storage: LocalStorage,
    private readonly timer: Timer,
    private readonly events: LocalDraftsEvents,
  ) {}

  read(): DraftRecord {
    return draftsIn(this.storage.load(DRAFTS_KEY));
  }

  changed(drafts: DraftRecord): void {
    this.pending = drafts;
    this.unwritten = true;
    this.stopWaiting();
    this.waiting = this.timer.start(() => this.write(), DRAFT_PAUSE_MS);
  }

  flush(): void {
    this.stopWaiting();
    if (this.unwritten) this.write();
  }

  private stopWaiting(): void {
    if (this.waiting === null) return;
    this.timer.stop(this.waiting);
    this.waiting = null;
  }

  private write(): void {
    this.waiting = null;
    try {
      this.storage.save(DRAFTS_KEY, this.pending);
    } catch (error) {
      this.report(error);
      return;
    }
    if (!this.keeps(this.pending)) {
      this.report(new Error(NOT_KEPT));
      return;
    }
    this.unwritten = false;
    this.failing = false;
    this.events.written();
  }

  private keeps(drafts: DraftRecord): boolean {
    return JSON.stringify(draftsIn(this.storage.load(DRAFTS_KEY))) === JSON.stringify(drafts);
  }

  private report(error: unknown): void {
    if (this.failing) return;
    this.failing = true;
    this.events.failed(error);
  }
}
