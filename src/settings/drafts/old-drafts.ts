import { draftsIn, type DraftRecord } from "./draft-record";
import type { LocalStorage } from "./local-drafts";
import type { PluginSettings } from "../saved/plugin-settings";

export const MOVED_KEY = "dungeons-and-dinthla-old-drafts-moved";

function holdsDrafts(saved: unknown): saved is { drafts: unknown } {
  return typeof saved === "object" && saved !== null && "drafts" in saved;
}

export class OldDrafts {
  private left: DraftRecord = {};
  private inFile: boolean;

  constructor(
    saved: unknown,
    private readonly storage: LocalStorage,
  ) {
    this.inFile = holdsDrafts(saved);
    if (holdsDrafts(saved) && storage.load(MOVED_KEY) !== true) this.left = draftsIn(saved.drafts);
  }

  get waiting(): boolean {
    return Object.keys(this.left).length > 0;
  }

  get leftInFile(): boolean {
    return this.inFile && !this.waiting;
  }

  get texts(): DraftRecord {
    return { ...this.left };
  }

  keptOnDevice(): void {
    if (!this.waiting) return;
    this.storage.save(MOVED_KEY, true);
    this.left = {};
  }

  fileRewritten(): void {
    this.inFile = false;
  }

  dataOf(settings: PluginSettings): object {
    if (!this.waiting) return settings;
    return { ...settings, drafts: this.left };
  }
}
