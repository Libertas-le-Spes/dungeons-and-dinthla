import { vi } from "vitest";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { Campaign, SessionNote } from "../../src/campaign/record/campaign";
import { sessionNoteOf, sessionNumberOf } from "../../src/campaign/paths/session-file";
import type { WatchedCampaign } from "../../src/kind-notes/kind-note-watcher";
import { CAMPAIGN } from "./keeper-setup";

export class FakeCampaign implements WatchedCampaign {
  campaignFolder: string | null = CAMPAIGN;
  current: Campaign = buildCampaign([]);
  private readonly sessions = new Map<string, SessionNote>();
  private readonly readListeners = new Set<(path: string, text: string) => void>();
  private readonly openedListeners = new Set<(folder: string) => void>();
  readonly stopped = vi.fn();

  get sessionNotes(): SessionNote[] {
    return [...this.sessions.values()];
  }

  hold(path: string, text: string): void {
    const number = sessionNumberOf(path, CAMPAIGN);
    if (number === null) throw new Error(`${path} isn't a session`);
    this.sessions.set(path, sessionNoteOf(path, number, text));
    this.current = buildCampaign(this.sessionNotes);
  }

  drop(path: string): void {
    this.sessions.delete(path);
    this.current = buildCampaign(this.sessionNotes);
  }

  arrive(path: string, text: string): void {
    if (sessionNumberOf(path, CAMPAIGN) !== null) this.hold(path, text);
    for (const listener of this.readListeners) listener(path, text);
  }

  open(folder: string): void {
    for (const listener of this.openedListeners) listener(folder);
  }

  onNoteRead(listener: (path: string, text: string) => void): () => void {
    this.readListeners.add(listener);
    return () => {
      this.stopped();
      this.readListeners.delete(listener);
    };
  }

  onOpened(listener: (folder: string) => void): () => void {
    this.openedListeners.add(listener);
    return () => this.openedListeners.delete(listener);
  }
}
