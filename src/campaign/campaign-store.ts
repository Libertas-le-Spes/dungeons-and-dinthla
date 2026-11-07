import { buildCampaign } from "./build-campaign";
import type { Campaign, SessionNote } from "./campaign";
import { readSession, readSessions, type CampaignVault } from "./read-campaign";
import { sessionNoteOf, sessionNumberOf } from "./session-file";

export type CampaignListener = (campaign: Campaign) => void;

export class CampaignStore {
  private folder: string | null = null;
  private campaign: Campaign = buildCampaign([]);
  private readonly sessions = new Map<string, SessionNote>();
  private readonly editedWhileOpening = new Set<string>();
  private readonly listeners = new Set<CampaignListener>();
  private openings = 0;

  constructor(private readonly vault: CampaignVault) {}

  get current(): Campaign {
    return this.campaign;
  }

  get campaignFolder(): string | null {
    return this.folder;
  }

  subscribe(listener: CampaignListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async open(folder: string): Promise<void> {
    const opening = ++this.openings;
    this.folder = folder;
    this.editedWhileOpening.clear();
    const read = await readSessions(this.vault, folder);
    if (opening !== this.openings) return;
    const edited = [...this.editedWhileOpening].map((path) => this.sessions.get(path));
    this.sessions.clear();
    for (const session of read) this.sessions.set(session.path, session);
    for (const session of edited) {
      if (session !== undefined) this.sessions.set(session.path, session);
    }
    this.rebuild();
  }

  noteChanged(path: string, text: string): void {
    const number = this.numberInCampaign(path);
    if (number === null) return;
    this.sessions.set(path, sessionNoteOf(path, number, text));
    this.editedWhileOpening.add(path);
    this.rebuild();
  }

  noteDeleted(path: string): void {
    if (this.sessions.delete(path)) this.rebuild();
  }

  async noteRenamed(path: string, oldPath: string): Promise<void> {
    if (oldPath === this.folder) {
      await this.open(path);
      return;
    }
    const wasSession = this.sessions.delete(oldPath);
    const isSession = await this.readIfSession(path);
    if (wasSession || isSession) this.rebuild();
  }

  private async readIfSession(path: string): Promise<boolean> {
    const number = this.numberInCampaign(path);
    const file = this.vault.getFileByPath(path);
    if (number === null || file === null) return false;
    const opening = this.openings;
    const session = await readSession(file, number, this.vault);
    if (opening !== this.openings) return false;
    this.sessions.set(path, session);
    return true;
  }

  private numberInCampaign(path: string): number | null {
    if (this.folder === null) return null;
    return sessionNumberOf(path, this.folder);
  }

  private rebuild(): void {
    this.campaign = buildCampaign([...this.sessions.values()]);
    for (const listener of this.listeners) listener(this.campaign);
  }
}
